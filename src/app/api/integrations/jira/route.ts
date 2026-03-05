import { NextRequest, NextResponse } from "next/server";
import { getJiraConnector } from "../../../../../bot/lib/jira-connector";

/**
 * GET /api/integrations/jira — List Jira tickets for the current user.
 * Query params: ?email=user@example.com&search=query
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const search = request.nextUrl.searchParams.get("search");
    const connector = getJiraConnector();

    if (search) {
      const tickets = await connector.searchTickets(search);
      return NextResponse.json({ tickets, stub: connector.isStubMode });
    }

    if (email) {
      const tickets = await connector.getMyTickets(email);
      return NextResponse.json({ tickets, stub: connector.isStubMode });
    }

    // Default: search all
    const tickets = await connector.searchTickets("");
    return NextResponse.json({ tickets, stub: connector.isStubMode });
  } catch (error) {
    console.error("[API] GET /api/integrations/jira error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/jira — Create a Jira ticket from a bot conversation.
 * Body: { summary, description, priority, reporter, conversationId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, description, priority, reporter, conversationId } = body;

    if (!summary || !description || !reporter) {
      return NextResponse.json(
        { error: "summary, description, and reporter are required" },
        { status: 400 }
      );
    }

    const connector = getJiraConnector();
    const ticket = await connector.createTicket(
      summary,
      description,
      priority ?? "Medium",
      reporter
    );

    // If a conversation ID was provided, link the ticket to it
    if (conversationId) {
      await connector.syncTicketToConversation(ticket.key, conversationId);
    }

    return NextResponse.json(
      { ticket, stub: connector.isStubMode },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/integrations/jira error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
