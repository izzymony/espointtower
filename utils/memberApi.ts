const BASE_URL = "https://espoint.onrender.com/espoint";

export const memberApi = {
  // GET members
  async getMembers(member?: string, status: string = "approved") {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const username = member?.trim() || storeUser.username?.trim() || "guest";

    try {
      const res = await fetch(
        `${BASE_URL}/get_members_records/${encodeURIComponent(username)}/${encodeURIComponent(status)}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch members: ${res.status} ${errText}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data?.msg || [];
    } catch (error) {
      console.error("Error fetching members:", error);
      return [];
    }
  },

  // Create member
  async createMember(
    username: string,
    admin: string,
    memberName: string,
    label: string,
    passcode: string,
    status: string
  ) {
    const storeUser = JSON.parse(localStorage.getItem("user") || "{}");
    const addedBy = storeUser.username || admin;

    const payload = {
      username,
      admin,
      type: "manual",
      members: {
        [memberName]: { admin, label, passcode, status, added_by: addedBy },
      },
    };

    const res = await fetch(`${BASE_URL}/create_member`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // Delete member
  async deleteMember(username: string, admin: string, memberName: string) {
    const payload = { username, admin, type: "manual", member: memberName };

    const res = await fetch(`${BASE_URL}/remove_member`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to delete member: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // Update member label
  async updateMemberLabel(username: string, admin: string, memberName: string, label: string) {
    const payload = { username, admin, type: "manual", member: memberName, label };

    const res = await fetch(`${BASE_URL}/update_member_label`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to update member label: ${res.status} ${errText}`);
    }

    return res.json();
  },

  // Change member status
  async changeMemberStatus(memberName: string, status: string, admin: string, username: string) {
    const payload = { member: memberName, status, admin, username };

    const res = await fetch(`${BASE_URL}/change_member_status`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to change member status: ${res.status} ${errText}`);
    }

    return res.json();
  },

  //change member passcode

  async changeMemberPasscode(memberName: string,  admin: string, username:string, passcode:string){
    const payload = {member: memberName, admin, username, passcode};

    const res = await fetch (`${BASE_URL}/change_member_passcode`,{
      method: "POST",
      headers:{Accept: "application/json", "Content-Type" : "application/json"},
      body: JSON.stringify(payload),
    })
  }
};
