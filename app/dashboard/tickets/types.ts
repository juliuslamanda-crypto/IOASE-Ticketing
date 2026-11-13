
export type TicketListItem = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  client_name: string;
  product_name: string;
  helpdesk_name: string | null;
  created_at: string;
};
