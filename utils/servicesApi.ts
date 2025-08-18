const BASE_URL = "https://espoint.onrender.com/espoint";

export interface ServiceMember {
  memberId: string;
  memberName: string;

  roles: string[];
}

export interface Service {
  id: string;
  name: string;
  description?: string; // optional
  availability?: Record<string, { start: string; end: string }>;
  members?: ServiceMember[];
  createdAt?: string;
  createdBy?: string;
  status?: string; // add this too since API gives "active"
}


export interface Member {
  id: string;
  name: string;
  
}

export interface CreateUnitPayload {
  admin: string;       // creator username
  username: string;    // usually same as admin
  service_name: string;
  data: {
    description: string;
    status?: string;
    timetable?: Record<string, { start: string; end: string }>;
    staffs: {
      [memberName: string]: {
        status: string;
        issuedby: string;
        issuedtime: string;
        role: {
          [roleName: string]: {
            issuedby: string;
            status: string;
            issuedtime: string;
          };
        };
      };
    };
  };
}

export interface DeleteUnitPayload {
  service_id: string;
  username: string;
}

export interface RemoveStaffPayload {
  service_id: string;
  username: string;
  staff: string;
}

export interface RemoveMemberRolePayload {
  service_id: string;
  username: string;
  staff: string;
  role: string;
}

export interface ConfirmMemberRolePayload {
  service_id: string;
  staff: string;
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
  // ✅ Service management
  createUnit: (payload: CreateUnitPayload) =>
    apiRequest<{ success: boolean }>("create_unit", "POST", payload),

  deleteUnit: (payload: DeleteUnitPayload) =>
    apiRequest<{ success: boolean }>("delete_unit", "POST", payload),

getUnit: async (serviceId: string): Promise<Service> => {
  const raw = await apiRequest<any>(`get_unit/${serviceId}`);
  const s = raw?.msg;

  const normalized: Service = {
    id: s.service_id,
    name: s.service_name,
    description: s.store?.description ?? "",
    availability: s.store?.timetable ?? {},
    createdAt: s.created,
    createdBy: s.created_by,
    status: s.store?.status || s.status || "active",
    members: s.store?.staffs
      ? Object.entries(s.store.staffs).map(([memberName, staff]: [string, any]) => ({
          memberId: memberName,
          memberName,
         
          roles: staff.role ? Object.keys(staff.role) : [], // ✅ extract role names
        }))
      : [],
  };

  return normalized;
},



getAllService: async (staff: string): Promise<Service[]> => {
  const raw = await apiRequest<any>(`get_all_service/${staff}`);
  const arr = Array.isArray(raw?.msg) ? raw.msg : [];

  return arr.map((s: any) => ({
    id: s.service_id,
    name: s.service_name,
    description: s.store?.description ?? "", // some APIs may include store
    availability: s.store?.timetable ?? {},
    members: s.store?.staffs
      ? Object.entries(s.store.staffs).map(([memberName, staff]: [string, any]) => ({
          memberId: memberName,
          memberName,
          roles: staff.role ? Object.keys(staff.role) : [],
        }))
      : [],
    createdAt: s.created,
    createdBy: s.created_by,
    status: s.status,
  }));
},


getMembersNames: async (member: string) => {
  const raw = await apiRequest<any>(`get_members_records/${member}/approved`);
  const arr = safeArray<any>(raw);
  return arr.filter((m) => m.status === "approved").map((m) => m.member) as string[];
},


  // ✅ Staff & members
  removeStaff: (payload: RemoveStaffPayload) =>
    apiRequest<{ success: boolean }>("remove_staff", "POST", payload),

  removeMemberRole: (payload: RemoveMemberRolePayload) =>
    apiRequest<{ success: boolean }>("remove_member_role", "POST", payload),

  confirmMemberRole: (payload: ConfirmMemberRolePayload) =>
    apiRequest<{ success: boolean }>("confirm_member_role", "POST", payload),

  getMemberService: async (staff: string, member: string, status: string) =>
    safeArray<Service>(await apiRequest<any>(`get_member_service/${staff}/${member}/${status}`)),

  getMemberServiceRole: async (staff: string, member: string, serviceId: string) =>
    safeArray<ServiceMember>(await apiRequest<any>(`get_member_service_role/${staff}/${member}/${serviceId}`)),

  // ✅ Content
  createContent: (payload: CreateContentPayload) =>
    apiRequest<{ success: boolean }>("create_content", "POST", payload),

  getContent: (contentId: string) => apiRequest<any>(`get_content/${contentId}`),

  getAllContentByService: async (serviceUnit: string) =>
    safeArray<any>(await apiRequest<any>(`get_all_content_based_service/${serviceUnit}`)),
 
  // ✅ Payments
  createPayment: (payload: CreatePaymentPayload) =>
    apiRequest<{ success: boolean }>("create_payment", "POST", payload),

  getPayment: (paymentId: string) => apiRequest<any>(`get_payment/${paymentId}`),

  getMembersRecords: async (member: string, status: string) => {
  const data = await apiRequest<any>(`get_members_records/${member}/${status}`);

  const arr = Array.isArray(data?.msg) ? data.msg : [];

  return arr.map((m: any) => ({
    id: m.member,   // use the member name as unique id
    name: m.member, // display name
  })) as Member[];
},

  // ✅ Members - always return only approved
 
};
