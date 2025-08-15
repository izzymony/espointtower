const BASE_URL = "https://espoint.onrender.com/espoint";

export interface ServiceMember {
  memberId: string;
  memberName: string;
  role: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  availability?: string[];
  members?: ServiceMember[];
  createdAt?: string;
  createdBy?: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface CreateUnitPayload {
  name: string;
  description: string;
  availability?: string[];
  members: ServiceMember[];
  createdBy: string;
}

export interface DeleteUnitPayload {
  serviceId: string;
  staff: string;
}

export interface RemoveStaffPayload {
  staffId: string;
  serviceId: string;
}

export interface RemoveMemberRolePayload {
  memberId: string;
  role: string;
}

export interface ConfirmMemberRolePayload {
  memberId: string;
  role: string;
}

export interface CreateContentPayload {
  title: string;
  body: string;
  serviceUnit: string;
}

export interface CreatePaymentPayload {
  amount: number;
  serviceUnit: string;
  username: string;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  position: string;
}

// ===== API request helper =====
async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: object
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const options: RequestInit = { method, headers };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}/${endpoint}`, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  return res.json();
}

// Helper to always return arrays
function safeArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.msg)) return data.msg;
  return [];
}

// ===== API Methods =====
export const ServicesAPI = {
  // Service management
  createUnit: (payload: CreateUnitPayload) => apiRequest<Service>("create_unit", "POST", payload),
  deleteUnit: (payload: DeleteUnitPayload) => apiRequest<{ success: boolean }>("delete_unit", "POST", payload),
  getUnit: (serviceNameId: string) => apiRequest<Service>(`get_unit/${serviceNameId}`),
  getAllService: async (staff: string) =>
    safeArray<Service>(await apiRequest<any>(`get_all_service/${staff}`)),

  // Staff & members
  removeStaff: (payload: RemoveStaffPayload) => apiRequest<{ success: boolean }>("remove_staff", "POST", payload),
  removeMemberRole: (payload: RemoveMemberRolePayload) =>
    apiRequest<{ success: boolean }>("remove_member_role", "POST", payload),
  confirmMemberRole: (payload: ConfirmMemberRolePayload) =>
    apiRequest<{ success: boolean }>("confirm_member_role", "POST", payload),
  getMemberService: async (staff: string, member: string, status: string) =>
    safeArray<Service>(await apiRequest<any>(`get_member_service/${staff}/${member}/${status}`)),
  getMemberServiceRole: async (staff: string, member: string, serviceId: string) =>
    safeArray<ServiceMember>(await apiRequest<any>(`get_member_service_role/${staff}/${member}/${serviceId}`)),

  // Content
  createContent: (payload: CreateContentPayload) => apiRequest<{ success: boolean }>("create_content", "POST", payload),
  getContent: (contentId: string) => apiRequest<any>(`get_content/${contentId}`),
  getAllContentByService: async (serviceUnit: string) =>
    safeArray<any>(await apiRequest<any>(`get_all_content_based_service/${serviceUnit}`)),

  // Payments
  createPayment: (payload: CreatePaymentPayload) => apiRequest<{ success: boolean }>("create_payment", "POST", payload),
  getPayment: (paymentId: string) => apiRequest<any>(`get_payment/${paymentId}`),

  // Members -  Now only returns `id` & `name` of approved members
  getMembersRecords: async (member: string, status: string) => {
    const raw = await apiRequest<any>(`get_members_records/${member}/${status}`);
    const arr = safeArray<any>(raw);
    return arr.map((m) => ({
      id: m.id || m.memberId || m.username,
      name: m.name || m.memberName || m.username,
    })) as Member[];
  }
};
