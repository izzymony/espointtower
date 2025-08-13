/*  // utils/memberApi.ts
const BASE_URL = "https://espoint.onrender.com/espoint";

export const memberApi = {
  // ✅ GET members
  async getMembers(member?: string, status?: string) {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const username = member || storeUser.username || "guest";
    const memberStatus = status || (storeUser.role === "admin" ? "all" : "approved");

    const res = await fetch(`${BASE_URL}/get_members_records/${username}/${memberStatus}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch members: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data?.msg || [];
  },

  // ✅ Create member (auto added_by from logged-in user)
  async createMember(username: string, admin: string, memberName: string, label: string, passcode: string, status: string) {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const addedBy = storeUser.username || admin;

    const payload = {
      username,
      admin,
      type: "manual",
      members: {
        [memberName]: {
          admin,
          label,
          passcode,
          status,
          added_by: addedBy, // 👈 Auto from logged-in user
        },
      },
    };

    const res = await fetch(`${BASE_URL}/create_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Delete member
  async deleteMember(username: string, admin: string, memberName: string) {
    const payload = { username, admin, type: "manual", member: memberName };

    const res = await fetch(`${BASE_URL}/remove_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to delete member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Update member label
  async updateMemberLabel(username: string, admin: string, memberName: string, label: string) {
    const payload = { username, admin, type: "manual", member: memberName, label };

    const res = await fetch(`${BASE_URL}/update_member_label`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to update member label: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Change member status
  async changeMemberStatus(memberName: string, status: string, admin: string, username: string) {
    const payload = { member: memberName, status, admin, username };

    const res = await fetch(`${BASE_URL}/change_member_status`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to change member status: ${res.status} ${errText}`);
    }

    return res.json();
  },
};
 


 */

// utils/memberApi.ts
/* const BASE_URL = "https://espoint.onrender.com/espoint";

export const memberApi = {
  // ✅ GET members

  // utils/memberApi.ts
async getMembers(member?: string, status: string = "all") {
  const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
  const username = member || storeUser.username || "guest";

  const res = await fetch(`${BASE_URL}/get_members_records/${username}/${status}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch members: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data?.msg || [];
}

 ,

  // ✅ Create member and refresh members list
  async createMember(username: string, admin: string, memberName: string, label: string, passcode: string, status: string) {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const addedBy = storeUser.username || admin;

    const payload = {
      username,
      admin,
      type: "manual",
      members: {
        [memberName]: {
          admin,
          label,
          passcode,
          status,
          added_by: addedBy,
        },
      },
    };

    const res = await fetch(`${BASE_URL}/create_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create member: ${res.status} ${errText}`);
    }

    // ✅ First, confirm creation
    const createResult = await res.json();
    console.log("Member created:", createResult);

    // ✅ Immediately fetch updated members list
    const updatedList = await this.getMembers(username, status);
    return { createResult, updatedList };
  },

  // ✅ Delete member
  async deleteMember(username: string, admin: string, memberName: string) {
    const payload = { username, admin, type: "manual", member: memberName };

    const res = await fetch(`${BASE_URL}/remove_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to delete member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Update member label
  async updateMemberLabel(username: string, admin: string, memberName: string, label: string) {
    const payload = { username, admin, type: "manual", member: memberName, label };

    const res = await fetch(`${BASE_URL}/update_member_label`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to update member label: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Change member status
  async changeMemberStatus(memberName: string, status: string, admin: string, username: string) {
    const payload = { member: memberName, status, admin, username };

    const res = await fetch(`${BASE_URL}/change_member_status`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to change member status: ${res.status} ${errText}`);
    }

    return res.json();
  },
};
 */

const BASE_URL = "https://espoint.onrender.com/espoint";

export const memberApi = {
  //GET members
  async getMembers(member?: string, status: string = "all") {
  const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
  const username = member?.trim() || storeUser.username?.trim() || "all"; // default to 'all'

  // If status is 'all', convert to empty string for backend to interpret as 'no filter'
  const statusSegment = status === "all" ? "" : status;

  try {
    // If your backend requires no trailing slash after username if status is empty,
    // you might want to conditionally build URL here.
    // Assuming backend accepts trailing slash or empty segment:
    const url = statusSegment
      ? `${BASE_URL}/get_members_records/${encodeURIComponent(username)}/${encodeURIComponent(statusSegment)}`
      : `${BASE_URL}/get_members_records/${encodeURIComponent(username)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch members: ${res.status} ${errText}`);
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data?.msg)) {
      return data.msg;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}
,
  // Create member and refresh members list
  async createMember(username: string, admin: string, memberName: string, label: string, passcode: string, status: string) {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const addedBy = storeUser.username || admin;

    const payload = {
      username,
      admin,
      type: "manual",
      members: {
        [memberName]: {
          admin,
          label,
          passcode,
          status,
          added_by: addedBy,
        },
      },
    };

    const res = await fetch(`${BASE_URL}/create_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create member: ${res.status} ${errText}`);
    }

    const createResult = await res.json();
    console.log("Member created:", createResult);

    const updatedList = await this.getMembers(username, status);
    return { createResult, updatedList };
  },

  // ✅ Delete member
  async deleteMember(username: string, admin: string, memberName: string) {
    const payload = { username, admin, type: "manual", member: memberName };

    const res = await fetch(`${BASE_URL}/remove_member`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to delete member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Update member label
  async updateMemberLabel(username: string, admin: string, memberName: string, label: string) {
    const payload = { username, admin, type: "manual", member: memberName, label };

    const res = await fetch(`${BASE_URL}/update_member_label`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to update member label: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // ✅ Change member status
  async changeMemberStatus(memberName: string, status: string, admin: string, username: string) {
    const payload = { member: memberName, status, admin, username };

    const res = await fetch(`${BASE_URL}/change_member_status`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to change member status: ${res.status} ${errText}`);
    }

    return res.json();
  },
};
