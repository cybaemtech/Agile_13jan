import React, { useState } from "react";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { X, Plus, UserCheck, Crown, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AssigneeWithRole {
  userId: number;
  user: User;
  role: 'OWNER' | 'ASSIGNEE' | 'COLLABORATOR';
}

interface MultiAssigneeSelectProps {
  value: AssigneeWithRole[];
  onChange: (assignees: AssigneeWithRole[]) => void;
  availableUsers: User[];
  placeholder?: string;
  disabled?: boolean;
  currentUserId?: number;
  maxAssignees?: number;
  className?: string;
}

const ROLE_CONFIG = {
  OWNER: {
    label: 'Owner',
    description: 'Primary responsible person',
    icon: Crown,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    badgeColor: 'bg-purple-500',
  },
  ASSIGNEE: {
    label: 'Assignee',
    description: 'Active contributor',
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    badgeColor: 'bg-blue-500',
  },
  COLLABORATOR: {
    label: 'Collaborator',
    description: 'Involved team member',
    icon: Users,
    color: 'bg-green-100 text-green-700 border-green-300',
    badgeColor: 'bg-green-500',
  },
};

export function MultiAssigneeSelect({
  value,
  onChange,
  availableUsers,
  placeholder = "Select assignees...",
  disabled = false,
  currentUserId,
  maxAssignees = 5,
  className,
}: MultiAssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'ASSIGNEE' | 'COLLABORATOR'>('ASSIGNEE');

  const assignedUserIds = Array.isArray(value) ? value.map(a => a.userId) : [];
  const filteredUsers = Array.isArray(availableUsers) ? availableUsers.filter(user => 
    !assignedUserIds.includes(user.id) &&
    (user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const handleAddAssignee = (user: User) => {
    if (!Array.isArray(value) || value.length >= maxAssignees) return;
    
    const newAssignee: AssigneeWithRole = {
      userId: user.id,
      user,
      role: selectedRole,
    };
    
    onChange([...value, newAssignee]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemoveAssignee = (userId: number) => {
    onChange(Array.isArray(value) ? value.filter(a => a.userId !== userId) : []);
  };

  const handleRoleChange = (userId: number, newRole: 'OWNER' | 'ASSIGNEE' | 'COLLABORATOR') => {
    onChange(
      Array.isArray(value) ? value.map(assignee => 
        assignee.userId === userId 
          ? { ...assignee, role: newRole }
          : assignee
      ) : []
    );
  };

  const ownerCount = Array.isArray(value) ? value.filter(a => a.role === 'OWNER').length : 0;

  return (
    <div className={cn("space-y-4 relative", className)}>
      {/* Current Assignees */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Assigned Team Members ({Array.isArray(value) ? value.length : 0}/{maxAssignees})
          </label>
          <div className="space-y-3 relative z-10">
            {Array.isArray(value) && value.map((assignee, index) => {
              const roleConfig = ROLE_CONFIG[assignee.role];
              const RoleIcon = roleConfig.icon;
              
              return (
                <div
                  key={assignee.userId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors clear-both",
                    roleConfig.color,
                    disabled && "opacity-60"
                  )}
                  style={{ 
                    marginBottom: '16px',
                    position: 'relative',
                    zIndex: 10 - index // Ensure proper stacking order
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={assignee.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {assignee.user.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center z-20",
                        roleConfig.badgeColor
                      )}>
                        <RoleIcon className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{assignee.user.fullName}</span>
                        {assignee.userId === currentUserId && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
                        <span className="truncate">{assignee.user.email}</span>
                        <span className="flex-shrink-0">•</span>
                        <span className="flex-shrink-0">{roleConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!disabled && (
                      <>
                        <Select
                          value={assignee.role}
                          onValueChange={(role: 'OWNER' | 'ASSIGNEE' | 'COLLABORATOR') => 
                            handleRoleChange(assignee.userId, role)
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER" disabled={assignee.role !== 'OWNER' && ownerCount >= 1}>
                              <div className="flex items-center gap-2">
                                <Crown className="h-3 w-3" />
                                Owner
                              </div>
                            </SelectItem>
                            <SelectItem value="ASSIGNEE">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-3 w-3" />
                                Assignee
                              </div>
                            </SelectItem>
                            <SelectItem value="COLLABORATOR">
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Collaborator
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleRemoveAssignee(assignee.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Assignee Button */}
      {!disabled && Array.isArray(value) && value.length < maxAssignees && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Plus className="h-4 w-4 mr-2" />
              {value.length === 0 ? placeholder : "Add another assignee"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={selectedRole}
                  onValueChange={(role: 'OWNER' | 'ASSIGNEE' | 'COLLABORATOR') => setSelectedRole(role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER" disabled={ownerCount >= 1}>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Owner</div>
                          <div className="text-xs text-gray-500">Primary responsible</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ASSIGNEE">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Assignee</div>
                          <div className="text-xs text-gray-500">Active contributor</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="COLLABORATOR">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Collaborator</div>
                          <div className="text-xs text-gray-500">Involved team member</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Available Users ({filteredUsers.length})
                </label>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        {searchQuery ? "No users found matching your search" : "No available users"}
                      </div>
                    ) : (
                      Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer border transition-colors"
                          onClick={() => handleAddAssignee(user)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-gray-100">
                              {user.fullName?.split(' ').map(n => n[0]).join('') || '??'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.fullName}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                          
                          <Badge variant="secondary" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Helpful Info */}
      {Array.isArray(value) && value.length === 0 && !disabled && (
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          <div className="font-medium mb-1">💡 Professional Agile Assignment</div>
          <div>
            • <strong>Owner:</strong> Scrum Master or primary responsible person<br/>
            • <strong>Assignee:</strong> Developer actively working on the item<br/>
            • <strong>Collaborator:</strong> Team member involved in discussions
          </div>
        </div>
      )}
    </div>
  );
}