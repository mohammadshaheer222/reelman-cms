import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';
import { generateId } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { messages, apiKey: userApiKey, clientContext, executeAction } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = (lastMessage?.content || '').trim();

    // 1. Fetch live CRM data (all active statuses and all active clients)
    const [statuses, clientsCount, allClients, defaultStatus] = await Promise.all([
      Status.find({ isActive: true }).sort({ order: 1 }).lean(),
      Client.countDocuments({ isArchived: { $ne: true } }),
      Client.find({ isArchived: { $ne: true } })
        .sort({ updatedAt: -1 })
        .populate('status', 'name color')
        .lean(),
      Status.findOne({ name: 'New' }).lean() || Status.findOne().sort({ order: 1 }).lean(),
    ]);

    // Group clients by status
    const clientsByStatus: Record<string, any[]> = {};
    statuses.forEach((s) => {
      clientsByStatus[s.name] = [];
    });
    clientsByStatus['Other'] = [];

    allClients.forEach((c) => {
      const sName = (c.status as any)?.name || 'Other';
      if (!clientsByStatus[sName]) clientsByStatus[sName] = [];
      clientsByStatus[sName].push(c);
    });

    // Remove empty 'Other' if unused
    if (clientsByStatus['Other'].length === 0) {
      delete clientsByStatus['Other'];
    }

    // Aggregate key metrics
    const statusCounts = await Client.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalWorkPrice: { $sum: '$workPrice' }, totalAdvance: { $sum: '$advancePaid' } } }
    ]);

    const statusMap = new Map(statuses.map((s) => [s._id.toString(), s.name]));
    const pipelineSummary = statusCounts.map((sc) => ({
      status: statusMap.get(sc._id?.toString()) || 'Unknown',
      count: sc.count,
      totalWorkPrice: sc.totalWorkPrice || 0,
      totalAdvance: sc.totalAdvance || 0,
    }));

    const totalPipelineValue = pipelineSummary.reduce((sum, s) => sum + s.totalWorkPrice, 0);
    const totalAdvanceCollected = pipelineSummary.reduce((sum, s) => sum + s.totalAdvance, 0);
    const pendingBalance = Math.max(0, totalPipelineValue - totalAdvanceCollected);

    // 2. Check for explicit action execution (e.g. create lead from AI)
    if (executeAction) {
      if (executeAction.type === 'create_client') {
        const { name, phone, date, location, requirements, workPrice, advancePaid, noteContent } = executeAction.payload || {};
        const clientId = generateId('RC');
        
        const initialStatus = defaultStatus?._id || statuses[0]?._id;

        const newClient = await Client.create({
          clientId,
          name: name || undefined,
          phone: phone || undefined,
          date: date || undefined,
          location: location || undefined,
          requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
          workPrice: Number(workPrice) || 0,
          advancePaid: Number(advancePaid) || 0,
          paymentStatus: (Number(advancePaid) > 0 && Number(advancePaid) >= Number(workPrice)) ? 'fully-paid' : (Number(advancePaid) > 0 ? 'advance-received' : 'unpaid'),
          status: initialStatus,
          notes: noteContent ? [{ content: noteContent, createdBy: user!.userId, createdAt: new Date(), updatedAt: new Date() }] : [],
          createdBy: user!.userId,
        });

        await Activity.create({
          clientId: newClient._id,
          userId: user!.userId,
          action: 'ai_client_create',
          description: `AI Agent created client ${newClient.name || 'Unnamed'} via chat`,
          metadata: { clientId: newClient.clientId },
        });

        return NextResponse.json({
          role: 'assistant',
          content: `✅ Successfully added **${newClient.name || 'New Client'}** to your CRM!`,
          actionResult: {
            success: true,
            type: 'client_created',
            client: {
              _id: newClient._id,
              clientId: newClient.clientId,
              name: newClient.name,
              phone: newClient.phone,
              date: newClient.date,
            }
          }
        });
      }

      if (executeAction.type === 'add_note' && executeAction.payload?.clientId) {
        const target = await Client.findOne({ clientId: executeAction.payload.clientId });
        if (target) {
          target.notes.push({
            content: executeAction.payload.content,
            createdBy: user!.userId as unknown as mongoose.Types.ObjectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
          await target.save();

          await Activity.create({
            clientId: target._id,
            userId: user!.userId,
            action: 'ai_note_add',
            description: `AI Agent added note to client ${target.name || target.clientId}`,
          });

          return NextResponse.json({
            role: 'assistant',
            content: `📝 Added note to **${target.name || 'Client'}**: "${executeAction.payload.content}"`,
            actionResult: { success: true, type: 'note_added' }
          });
        }
      }
    }

    // 3. Resolve API Key (from env or user-provided)
    const effectiveApiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();

    // 4. Format all clients grouped by status for Gemini context (Strictly without technical IDs)
    const groupedClientsPrompt = Object.entries(clientsByStatus)
      .map(([statusName, list]) => {
        if (list.length === 0) return `[STATUS: ${statusName}] (0 clients)`;
        const items = list
          .map((c) => {
            const balance = Math.max(0, (c.workPrice || 0) - (c.advancePaid || 0));
            return `  • Client: ${c.name || 'Unnamed Client'} | Phone: ${c.phone || 'No phone'} | Shoot Date: ${c.date || 'Date to be fixed'} | Location: ${c.location || 'Not specified'} | Price: ₹${(c.workPrice || 0).toLocaleString()} | Advance: ₹${(c.advancePaid || 0).toLocaleString()} | Balance: ₹${balance.toLocaleString()}`;
          })
          .join('\n');
        return `[STATUS: ${statusName}] (${list.length} clients):\n${items}`;
      })
      .join('\n\n');

    // 5. System prompt for studio AI agent
    const systemInstruction = `
You are the Reelman AI Studio Manager & Copilot for "Reelman Flow" - a production studio CRM for photo, video, media houses, and wedding/commercial creators.
You are warm, helpful, simple, and speak in plain everyday language that any studio owner or assistant can instantly understand.

LIVE CRM OVERVIEW:
- Total Active Clients: ${clientsCount}
- Total Revenue/Pipeline Value: ₹${totalPipelineValue.toLocaleString()}
- Total Advance Collected: ₹${totalAdvanceCollected.toLocaleString()}
- Total Pending Balance: ₹${pendingBalance.toLocaleString()}
- Available Pipeline Stages: ${statuses.map((s) => s.name).join(', ')}

CURRENT CLIENTS GROUPED BY EVERY STATUS:
${groupedClientsPrompt}

${clientContext ? `CURRENT CLIENT PROFILE CONTEXT:\n${JSON.stringify(clientContext, null, 2)}` : ''}

CAPABILITIES:
1. All Status & Client Details: When asked about clients, pipeline, or statuses, ALWAYS give the complete breakdown showing the clients under each status with their Name, Phone, Shoot Date, Location, and Payment balance.
2. Production Proposals: Draft creative packages (Traditional Photo + Cinematic Video + 4K Drone + Pre-wedding Shoot + Luxury Album) with transparent pricing.
3. Client Communication: Draft polite, effective WhatsApp follow-up messages, payment reminder notes, and booking confirmations.
4. Lead Creation: If the user says "Add client / Create lead / Book ...", output an action block in this JSON format:
\`\`\`action:create_client
{
  "name": "Client Name",
  "phone": "Phone Number",
  "date": "YYYY-MM-DD",
  "location": "City/Venue",
  "requirements": ["Cinematic Video", "Drone"],
  "workPrice": 50000,
  "advancePaid": 10000,
  "noteContent": "Brief notes from conversation"
}
\`\`\`

CRITICAL RULES FOR OUTPUT (USER-FRIENDLY & NO IDS):
- NEVER mention client IDs, database IDs, or code identifiers (like RC-xxxx, 64aef..., etc.).
- ALWAYS refer to clients simply by their Name (e.g. "Rahul", "Priya", or "Unnamed Client").
- Keep explanations simple, natural, and free of technical jargon.
- Format money clearly with ₹ (Rupees) and commas (e.g. ₹75,000).
- When asked for all statuses or client details, display every status as a clear header with the client details below it.
`;

    // 6. Call Google Gemini API if API key is provided
    if (effectiveApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveApiKey}`;
        
        const contents = [
          ...messages.slice(-8).map((m: ChatMessage) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        ];

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            let actionData = null;
            const actionMatch = candidateText.match(/```action:create_client\s*([\s\S]*?)\s*```/);
            if (actionMatch && actionMatch[1]) {
              try {
                actionData = {
                  type: 'create_client',
                  payload: JSON.parse(actionMatch[1]),
                };
              } catch {
                // Ignore parse errors
              }
            }

            return NextResponse.json({
              role: 'assistant',
              content: candidateText,
              provider: 'gemini-2.0-flash',
              actionData,
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini fetch exception:', geminiErr);
      }
    }

    // 7. Smart Built-In Fallback Agent (Organized by all statuses with client details)
    const lowerQuery = userQuery.toLowerCase();
    let reply = '';
    let suggestedAction = null;

    // Check if user is asking for all statuses or client details
    const isAskingForClientDetails =
      lowerQuery.includes('all status') ||
      lowerQuery.includes('status client') ||
      lowerQuery.includes('client detail') ||
      lowerQuery.includes('all client') ||
      lowerQuery.includes('list client') ||
      lowerQuery.includes('show client') ||
      lowerQuery.includes('every status') ||
      lowerQuery.includes('pipeline');

    // Check if user is asking for a specific status (e.g. "active client details", "confirmed clients", "pending status")
    const matchingStatus = statuses.find((s) => {
      const sLower = s.name.toLowerCase();
      // Match whole word or exact status phrase
      const regex = new RegExp(`\\b${sLower}\\b`, 'i');
      return regex.test(lowerQuery);
    });

    if (
      matchingStatus &&
      (lowerQuery.includes('client') ||
        lowerQuery.includes('detail') ||
        lowerQuery.includes('status') ||
        lowerQuery.includes('who') ||
        lowerQuery.includes('list') ||
        lowerQuery.includes('show'))
    ) {
      const list = clientsByStatus[matchingStatus.name] || [];
      if (list.length > 0) {
        const clientsText = list
          .map((c) => {
            const balance = Math.max(0, (c.workPrice || 0) - (c.advancePaid || 0));
            const shootDateStr = c.date ? c.date : 'Date to be fixed';
            const locationStr = c.location ? ` | Location: ${c.location}` : '';
            const phoneStr = c.phone ? ` | Phone: ${c.phone}` : '';
            const paymentStr = c.workPrice
              ? ` | Total: ₹${c.workPrice.toLocaleString()} (Advance: ₹${(c.advancePaid || 0).toLocaleString()}, Balance: ₹${balance.toLocaleString()})`
              : '';
            return `• **${c.name || 'Unnamed Client'}**${phoneStr} | Shoot: **${shootDateStr}**${locationStr}${paymentStr}`;
          })
          .join('\n');

        reply = `### 🟢 Clients in "${matchingStatus.name}" Status (${list.length} client${list.length === 1 ? '' : 's'})\n\n` +
          clientsText;
      } else {
        reply = `There are currently no clients in the **"${matchingStatus.name}"** status.\n\n` +
          `Other statuses with clients:\n` +
          Object.entries(clientsByStatus)
            .filter(([_, arr]) => arr.length > 0)
            .map(([st, arr]) => `• **${st}**: ${arr.length} client(s)`)
            .join('\n');
      }
    } else if (isAskingForClientDetails) {
      // Build a full status-by-status breakdown of all clients
      let statusDetailsText = '';

      Object.entries(clientsByStatus).forEach(([statusName, list]) => {
        statusDetailsText += `\n#### 📌 Status: ${statusName} (${list.length} client${list.length === 1 ? '' : 's'})\n`;
        if (list.length === 0) {
          statusDetailsText += `*No clients in this stage currently.*\n`;
        } else {
          list.forEach((c) => {
            const balance = Math.max(0, (c.workPrice || 0) - (c.advancePaid || 0));
            const shootDateStr = c.date ? c.date : 'Date to be fixed';
            const locationStr = c.location ? ` | Location: ${c.location}` : '';
            const phoneStr = c.phone ? ` | Phone: ${c.phone}` : '';
            const paymentStr = c.workPrice
              ? ` | Total: ₹${c.workPrice.toLocaleString()} (Advance: ₹${(c.advancePaid || 0).toLocaleString()}, Balance: ₹${balance.toLocaleString()})`
              : '';

            statusDetailsText += `• **${c.name || 'Unnamed Client'}**${phoneStr} | Shoot: **${shootDateStr}**${locationStr}${paymentStr}\n`;
          });
        }
      });

      reply = `### 📋 All Clients & Status Details\n\n` +
        `**Studio Summary:**\n` +
        `* **Total Active Clients:** ${clientsCount}\n` +
        `* **Total Bookings Value:** ₹${totalPipelineValue.toLocaleString()}\n` +
        `* **Advance Received:** ₹${totalAdvanceCollected.toLocaleString()}\n` +
        `* **Pending Balance to Collect:** ₹${pendingBalance.toLocaleString()}\n` +
        `\n---\n` +
        statusDetailsText;
    } else if (lowerQuery.includes('follow') || lowerQuery.includes('pending') || lowerQuery.includes('reminder')) {
      const followUpClients = allClients.filter((c) => {
        const stageName = (c.status as any)?.name?.toLowerCase() || '';
        return stageName.includes('follow') || stageName.includes('quote') || stageName.includes('new');
      });

      reply = `### 🎯 Clients Needing Immediate Follow-up\n\n` +
        (followUpClients.length > 0
          ? followUpClients.map((c) => `• **${c.name || 'Client'}** — Status: **${(c.status as any)?.name}** | Phone: ${c.phone || 'No phone'} | Shoot Date: ${c.date || 'Date to be fixed'}`).join('\n')
          : `Great news! You have no clients stuck in initial follow-up stages right now.`) +
        `\n\n#### Recommended Next Steps:\n` +
        `1. Send a friendly WhatsApp message asking if they have finalized their event timing.\n` +
        `2. Share a highlight reel link to build excitement.\n` +
        `3. Lock dates with an initial token advance.`;
    } else if (lowerQuery.includes('proposal') || lowerQuery.includes('package') || lowerQuery.includes('quotation') || lowerQuery.includes('quote')) {
      reply = `### 📸 Studio Production Package Proposal\n\n` +
        `**Package Name:** Cinematic Wedding & Event Signature\n` +
        `**Standard Deliverables:**\n` +
        `* 1x Traditional 4K Video + 1x Cinematic Teaser (60-90 sec)\n` +
        `* 1x Full Event Highlight Film (3-5 mins)\n` +
        `* Unlimited High-Res Retouched Candid & Traditional Photos\n` +
        `* Drone Aerial Coverage (Subject to venue permissions)\n` +
        `* 1x Hardbound Premium Velvet Photo Album (40 sheets)\n` +
        `* Fast turnaround delivery via Cloud Gallery link\n\n` +
        `**Commercial Terms:**\n` +
        `* **Total Investment:** ₹75,000\n` +
        `* **Advance Token (To lock dates):** 30% (₹22,500)\n` +
        `* **Day of Event:** 50% (₹37,500)\n` +
        `* **Upon Final Delivery:** 20% (₹15,000)`;
    } else if (lowerQuery.includes('whatsapp') || lowerQuery.includes('message') || lowerQuery.includes('draft')) {
      reply = `### 💬 Ready-to-Send WhatsApp Follow-up Template\n\n` +
        `> *"Hi! 👋 Greetings from Reelman Production Studio. We hope you're doing well! We wanted to check in regarding your upcoming shoot dates. Our calendar for this season is filling up fast, and we would love to secure your date with our crew. Let us know if you have any questions about the packages or if you'd like to customize the deliverables! Looking forward to creating something beautiful together. 🎬✨"*`;
    } else if (lowerQuery.startsWith('add') || lowerQuery.startsWith('create') || lowerQuery.includes('new lead')) {
      const nameMatch = userQuery.match(/(?:for|named|name)\s+([A-Za-z\s]+?)(?:,|$|\s+phone|\s+date|\s+shoot)/i);
      const phoneMatch = userQuery.match(/\b\d{10}\b/);
      const parsedName = nameMatch ? nameMatch[1].trim() : 'New Lead';
      const parsedPhone = phoneMatch ? phoneMatch[0] : '';

      suggestedAction = {
        type: 'create_client',
        payload: {
          name: parsedName,
          phone: parsedPhone,
          noteContent: userQuery,
        }
      };

      reply = `I can create this lead directly for you:\n\n` +
        `* **Client Name:** ${parsedName}\n` +
        `* **Phone:** ${parsedPhone || 'Not specified'}\n` +
        `* **Initial Note:** "${userQuery}"\n\n` +
        `Click **"Create Client Record Now"** below to add them to your CRM!`;
    } else {
      reply = `Hello! I am your **Reelman Studio AI Assistant**.\n\n` +
        `I am connected directly to your CRM database. Here is what I can do for you:\n\n` +
        `• 📋 **Show All Clients by Status:** Ask *"Show all status client details"* to see every client organized by stage\n` +
        `• 📊 **Analyze Pipeline & Revenue:** Ask *"Summarize CRM pipeline"* or *"How much advance is pending?"*\n` +
        `• 🎯 **Lead Follow-ups:** Ask *"Who needs follow-up?"* or *"Draft a WhatsApp follow-up message"*\n` +
        `• 📸 **Proposals & Packages:** Ask *"Draft a photography package quote"*\n` +
        `• ➕ **Quick Lead Creation:** Type *"Add lead for Rahul, 9876543210, wedding shoot in Goa"*\n\n` +
        `*(To enable full conversational reasoning powered by Google Gemini 2.0 Flash for free, click the ⚙️ Settings icon in the top right of this chat window and enter a free Google AI Studio key!)*`;
    }

    return NextResponse.json({
      role: 'assistant',
      content: reply,
      provider: effectiveApiKey ? 'gemini-fallback' : 'local-crm-agent',
      actionData: suggestedAction,
      hasGeminiKey: Boolean(effectiveApiKey),
    });
  } catch (err: unknown) {
    console.error('AI chat route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI Assistant error' },
      { status: 500 }
    );
  }
}
