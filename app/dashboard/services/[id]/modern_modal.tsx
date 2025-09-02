      import { Button } from "@/components/ui/button";
import { Trash2, Users, Plus } from "lucide-react";

      {/* 🎨 MODERN Edit Service Modal */}
      {showEditService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditService(false)}>
          <div 
            className="bg-white shadow-2xl rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Modern Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
                  <p className="text-sm text-gray-500 mt-1">Update service details and manage team members</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditService(false)}
                  className="rounded-full h-10 w-10 p-0 hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {editError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-red-800 text-sm font-medium">{editError}</div>
                </div>
              )}
              
              <form onSubmit={handleEditService} className="space-y-8" id="edit-service-form">
                {/* Basic Info Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="Enter service name"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select 
                        value={editStatus} 
                        onChange={e => setEditStatus(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="active">🟢 Active</option>
                        <option value="suspended">🔴 Suspended</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)} 
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                      rows={4}
                      placeholder="Describe your service..."
                    />
                  </div>
                </div>

                {/* Availability Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Availability Schedule
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(editAvailability).map(([day, times]) => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <span className="w-24 capitalize text-sm font-medium text-gray-700">{day}</span>
                        <input 
                          type="time" 
                          value={times.start} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, start: e.target.value } })} 
                          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <span className="text-gray-400 font-medium">to</span>
                        <input 
                          type="time" 
                          value={times.end} 
                          onChange={(e) => setEditAvailability({ ...editAvailability, [day]: { ...times, end: e.target.value } })} 
                          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          onClick={() => {
                            const copy = { ...editAvailability };
                            delete copy[day];
                            setEditAvailability(copy);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-4">
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        defaultValue="" 
                        onChange={(e) => {
                          const newDay = e.target.value;
                          if (newDay && !editAvailability[newDay]) {
                            setEditAvailability({ ...editAvailability, [newDay]: { start: "09:00", end: "17:00" } });
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">+ Add Day</option>
                        {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
                          .filter(d => !Object.keys(editAvailability).includes(d))
                          .map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Existing Members Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Current Team Members
                  </h3>
                  {service.members && service.members.length > 0 ? (
                    <div className="space-y-4">
                      {service.members.map(member => (
                        <div key={member.memberId} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">
                                {member.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {member.memberName}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                              <label key={role} className="group relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only"
                                  checked={(editedMembers[member.memberId] || member.roles).includes(role)}
                                  onChange={e => handleExistingMemberRoleChange(
                                    member.memberId, 
                                    role, 
                                    e.target.checked
                                  )}
                                />
                                <div className={`
                                  px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200
                                  ${(editedMembers[member.memberId] || member.roles).includes(role)
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                  }
                                `}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No team members assigned yet</p>
                    </div>
                  )}   
                </div>

                {/* Add New Members Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Add New Members
                    </h3>
                    <Button 
                      type="button" 
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white rounded-full px-4 py-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={handleAddNewMember}
                      disabled={availableMembers.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                  
                  {newMembers.length > 0 ? (
                    <div className="space-y-4">
                      {newMembers.map((newMember, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <select 
                              value={newMember.id}
                              onChange={e => handleNewMemberSelect(index, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-3"
                            >
                              {availableMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => handleRemoveNewMember(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                              <label key={role} className="group relative">
                                <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={newMember.roles.includes(role)}
                                  onChange={e => handleNewMemberRoleChange(
                                    index,
                                    role,
                                    e.target.checked
                                  )}
                                />
                                <div className={`
                                  px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200
                                  ${newMember.roles.includes(role)
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                  }
                                `}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Click &quot;Add Member&quot; to assign new team members</p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modern Footer */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditService(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="edit-service-form" 
                  className="px-8 py-2 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}