// Run this script to add sample data with an admin user
// You can run this in the browser console or create a button to execute it

const sampleMembers = [
  {
    id: "1",
    name: "John Admin",
    email: "admin@company.com",
    passcode: "ADMIN123",
    status: "active",
    position: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Jane Manager",
    email: "jane@company.com",
    passcode: "JANE456",
    status: "active",
    position: "manager",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Bob Staff",
    email: "bob@company.com",
    passcode: "BOB789",
    status: "active",
    position: "staff",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Alice Intern",
    email: "alice@company.com",
    passcode: "ALICE101",
    status: "pending",
    position: "intern",
    createdAt: new Date().toISOString(),
  },
]

// Save to localStorage
localStorage.setItem("members", JSON.stringify(sampleMembers))
console.log("Sample data added! You can now sign in with:")
console.log("Admin: admin@company.com / ADMIN123")
console.log("Manager: jane@company.com / JANE456")
console.log("Staff: bob@company.com / BOB789")
console.log("Intern: alice@company.com / ALICE101")
