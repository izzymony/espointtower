// servicesApi.ts - Refactored with proper types
const BASE_URL = "https://espoint.onrender.com/espoint";

// ===== Interfaces =====
export interface ServiceRole {
  issuedby: string;
  status: string;
  issuedtime: string;
}

export interface ServiceStaff {
  status: string;
  issuedby: string;
  issuedtime: string;
  role: Record<string, ServiceRole>;
}

export interface ServiceMember {
  memberId: string;
  memberName: string;
  status?: string;  roles: string[];
}

export interface ServiceStore {
  description?: string;
  status?: string;
  timetable?: Record<string, { start: string; end: string }>;
  staffs?: Record<string, ServiceStaff>;
}

export interface ServiceResponse {
  service_id: string;
  service_name: string;
  store?: ServiceStore;
  created?: string;
  created_by?: string;
  status?: string;
  issuedtime?: string;
}

export interface UpdateUnitPayload {
  service_id: string;
  username: string;
  data: {
    service_name?: string;
    description?: string;
    status?: string;
    timetable?: Record<string, { start: string; end: string }>;
    staffs?: Record<string, ServiceStaff>;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  availability?: Record<string, { start: string; end: string }>;
  members?: ServiceMember[];
  createdAt?: string;
  createdBy?: string;
  status?: string;
}

export interface MemberRecord {
  member: string;
  status: string;
  name?: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface CreateMemberPayload {
  username: string;
  admin: string;
  type: string;
  members: {
    [memberName: string]: {
      admin: string;
      label: string;
      passcode: string;
      status: string;
    };
  };
}

export interface CreateUnitPayload {
  admin: string;
  username: string;
  service_name: string;
  data: {
    description: string;
    status?: string;
    timetable?: Record<string, { start: string; end: string }>;
    staffs: {
      [memberName: string]: ServiceStaff;
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

export interface CreateServiceContentPayload {
  created_by: string;
  service: string;
  service_id: string;
  service_unit: string;
  username: string;
  data: {
    branding: {
      logo_url: string[];
    };
    eligible_roles: string;
    service_hours: {
      start: string;
      end: string;
    };
    rental_items: Record<
      string,
      {
        item: string;
        quantity: string;
        duration_hours: string;
      }
    >;
    discount_percent: string;
    duration_minutes: string;
    base_price: string;
    category: string;
    name: string;
    status: string;
    description: string;
  };
}

export interface CreateBookingPayload {
  client_email: string;
  preferred_staff_id: string;
  notes: string;
  service_time: string;
  service_date: string;
  client_phone: string;
  client_name: string;
  service_package_id: string;
  status: string;
  completed_date: string;
  booking_code: string;
  service_unit: string;
  service: string;
}

export interface CreateBookingRequest{
  service: string;
  service_unit: string;
  username: string;
  from: "internal" | "external";
  service_id: string;
  data: CreateBookingPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  msg?: T;
}

// ===== API request helper =====
async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: object
): Promise<T> {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = storedUser?.token || storedUser?.accessToken; 
  const headers: HeadersInit = { 
    "Content-Type": "application/json", 
    ...(token ? { Authorization: `Bearer ${token}` } : {}) 
  };
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
function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'msg' in data && Array.isArray((data as any).msg)) {
    return (data as any).msg;
  }
  return [];
}

// ===== API Methods =====
export const ServicesAPI = {
  // Service management
  createUnit: (payload: CreateUnitPayload) =>
    apiRequest<ApiResponse>("create_unit", "POST", payload),

  updateUnit: (payload: UpdateUnitPayload) =>
    apiRequest<ApiResponse>("create_unit", "POST", payload),

  deleteUnit: (payload: DeleteUnitPayload) =>
    apiRequest<ApiResponse>("delete_unit", "POST", payload),

  getUnit: async (serviceId: string): Promise<Service> => {
    const raw = await apiRequest<ApiResponse<ServiceResponse>>(`get_unit/${serviceId}`);
    const s = raw.msg;

    if (!s) {
      throw new Error("Service not found");
    }

    const normalized: Service = {
      id: s.service_id,
      name: s.service_name,
      description: s.store?.description ?? "",
      availability: s.store?.timetable ?? {},
      createdAt: s.created,
      createdBy: s.created_by,
      status: s.store?.status || s.status || "active",
      members: s.store?.staffs
        ? Object.entries(s.store.staffs).map(([memberName, staff]) => ({
            memberId: memberName,
            memberName,
            roles: staff.role ? Object.keys(staff.role) : [],
            status: staff.status || "approved"
          }))
        : [],
    };

    return normalized;
  },

  getAllService: async (): Promise<Service[]> => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const username = storedUser.username || "guest";

    const raw = await apiRequest<ApiResponse<ServiceResponse[]>>(`get_all_service/${username}`);
    const arr = Array.isArray(raw.msg) ? raw.msg : [];

    return arr.map(s => ({
      id: s.service_id,
      name: s.service_name,
      description: s.store?.description ?? "",
      availability: s.store?.timetable ?? {},
      members: s.store?.staffs
        ? Object.entries(s.store.staffs).map(([memberName, staff]) => ({
            memberId: memberName,
            memberName,
            roles: staff.role ? Object.keys(staff.role) : [],
          }))
        : [],
      createdAt: s.created,
      createdBy: s.created_by,
      status: s.status,
      issuedtime: s.issuedtime,
    }));
  },

  getMembersNames: async (member: string): Promise<string[]> => {
    const raw = await apiRequest<ApiResponse<MemberRecord[]>>(`get_members_records/${member}/approved`);
    const arr = safeArray<MemberRecord>(raw);
    return arr.filter(m => m.status === "approved").map(m => m.member);
  },

  // Staff & members
  removeStaff: (payload: RemoveStaffPayload) =>
    apiRequest<ApiResponse>("remove_staff", "POST", payload),

  removeMemberRole: (payload: RemoveMemberRolePayload) =>
    apiRequest<ApiResponse>("remove_member_role", "POST", payload),

  confirmMemberRole: (payload: ConfirmMemberRolePayload) =>
    apiRequest<ApiResponse>("confirm_member_role", "POST", payload),

  createMember: (payload: CreateMemberPayload) =>
    apiRequest<ApiResponse>("create_member", "POST", payload),

  getMemberService: async (staff: string, member: string, status: string): Promise<Service[]> => {
    const raw = await apiRequest<ApiResponse<ServiceResponse[]>>(`get_member_service/${staff}/${member}/${status}`);
    return safeArray<ServiceResponse>(raw).map(s => ({
      id: s.service_id,
      name: s.service_name,
      description: s.store?.description ?? "",
      availability: s.store?.timetable ?? {},
      members: s.store?.staffs
        ? Object.entries(s.store.staffs).map(([memberName, staff]) => ({
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

  getMemberServiceRole: async (staff: string, member: string, serviceId: string): Promise<ServiceMember[]> => {
    const raw = await apiRequest<ApiResponse>(`get_member_service_role/${staff}/${member}/${serviceId}`);
    return safeArray<ServiceMember>(raw);
  },

  createBooking: (payload: CreateBookingRequest) =>
    apiRequest<ApiResponse>("create_booking", "POST", payload),

  getBooking: (bookingId: string) =>
    apiRequest<ApiResponse>(`get_booking/${bookingId}`),

  getBookingsByStatus: (username: string, status: string, serviceUnit: string) =>
    apiRequest<ApiResponse>(`get_bookings_based_status_restricted/${username}/${status}/${serviceUnit}`),

  // Content
  createContent: (payload: CreateContentPayload) =>
    apiRequest<ApiResponse>("create_content", "POST", payload),

  createServiceContent: (payload: CreateServiceContentPayload) =>
    apiRequest<ApiResponse>("create_content", "POST", payload),

  getContent: (contentId: string) =>
    apiRequest<ApiResponse>(`get_content/${contentId}`),

  updateServiceContent: (contentId: string, payload: Partial<CreateServiceContentPayload>) => apiRequest<ApiResponse>(`update_content/${contentId}`, "POST", payload),

  getAllContentByService: async (serviceUnit: string) => {
    const raw = await apiRequest<ApiResponse>(`get_all_content_based_service/${serviceUnit}`);
    return safeArray<any>(raw);
  },

  // Payments
  createPayment: (payload: CreatePaymentPayload) =>
    apiRequest<ApiResponse>("create_payment", "POST", payload),

  getPayment: (paymentId: string) =>
    apiRequest<ApiResponse>(`get_payment/${paymentId}`),

  getMembersRecords: async (member: string, status: string): Promise<Member[]> => {
    const data = await apiRequest<ApiResponse<MemberRecord[]>>(`get_members_records/${member}/${status}`);
    const arr = safeArray<MemberRecord>(data);
    
    return arr.map(m => ({
      id: m.member,
      name: m.member,
    })) as Member[];
  },
};