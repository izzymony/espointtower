const API_BASE_URL = "https://espoint.onrender.com/espoint/";

const apiRequest = async(endpoint: string, method:string, data?: any) =>{
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
  } 
   
  try{
              const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              return await response.json();
  } catch(error) {
    console.error(`API error at ${endpoint}:`, error);
    throw error;
  }
  } 
  
  export const memberApi = {
     createMember: (data: {
              name: string;
              email: string;
              position: string;
              status: string;
              passcode:string
     })  => apiRequest("create_member", "POST", data),
    getMembers: (member: string = "" , status: string = "") => apiRequest(`get_members_records/${member}/${status}`, "GET"),
    
    updatedMemberStatus:(memberId: string, newStatus: string) => apiRequest("change_member_status", "PUT", { member:memberId, status: newStatus  }),

    updateMemberPasscode:(numberId: string, newPasscode: string) => apiRequest("change_member_passcode", "PUT",{member:numberId, passcode: newPasscode}),

    deleteMember:(memberId: string) => apiRequest("remove_member", "DELETE" , {member:memberId}),
    
  }
