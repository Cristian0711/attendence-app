'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { useSession } from '@/providers/session/SessionProvider';
import RoleProtectedPage from '@/components/roleprotect/RoleProtectedPage';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type EventGroup = {
    id: number;
    name: string;
};

const eventSchema = z.object({
    name: z.string().min(1, "Event name is required."),
    description: z.string().optional(),
    startTime: z.string().refine((val) => new Date(val) > new Date(), {
        message: "Start time must be in the future.",
    }),
    endTime: z.string(),
    isRecurring: z.boolean(),
    eventType: z.enum(['single', 'new_group', 'existing_group']),
    eventGroupId: z.number().optional(),
    groupName: z.string().optional(),
    recurrence: z.object({
        recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
        recurrenceInterval: z.number().int().positive(),
        recurrenceEndDate: z.string(),
    }).optional(),
}).refine((data) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (endTime <= startTime) {
        return false;
    }
    return true;
}, {
    message: "End time must be after start time.",
    path: ['endTime'],
}).refine((data) => {
    if (data.isRecurring && !data.recurrence) {
        return false;
    }
    if (data.isRecurring && data.recurrence) {
        const endDate = new Date(data.recurrence.recurrenceEndDate);
        const startTime = new Date(data.startTime);
        return endDate > startTime;
    }
    return true;
}, {
    message: "Recurrence end date must be after start time",
    path: ['recurrence.recurrenceEndDate'],
}).refine((data) => {
    if (data.eventType === 'new_group' && !data.groupName) {
        return false;
    }
    if (data.eventType === 'existing_group' && !data.eventGroupId) {
        return false;
    }
    return true;
}, {
    message: "Group information is required",
    path: ['groupName'],
});

export default function AddEventPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrencePattern, setRecurrencePattern] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [eventType, setEventType] = useState<'single' | 'new_group' | 'existing_group'>('single');
    const [eventGroupId, setEventGroupId] = useState<number>();
    const [groupName, setGroupName] = useState('');
    const [availableGroups, setAvailableGroups] = useState<EventGroup[]>([]);
    
    const router = useRouter();
    const { accessToken } = useSession();

    useEffect(() => {
        const fetchEventGroups = async () => {
            try {
                const response = await clientApiFetch('/api/events/geteventgroups', accessToken ?? "");
                if (response.ok) {
                    const data = await response.json();
                    setAvailableGroups(data.eventGroups);
                }
            } catch (error) {
                console.error('Failed to fetch event groups:', error);
            }
        };

        fetchEventGroups();
    }, [accessToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const eventData = {
                name,
                description,
                startTime,
                endTime,
                isRecurring,
                eventType,
                ...(eventType === 'new_group' && { groupName }),
                ...(eventType === 'existing_group' && { eventGroupId }),
                ...(isRecurring && {
                    recurrence: {
                        recurrencePattern,
                        recurrenceInterval,
                        recurrenceEndDate,
                    }
                })
            };

            const validatedData = eventSchema.parse(eventData);

            const response = await clientApiFetch('/api/events/add', accessToken ?? "", {
                body: JSON.stringify(validatedData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create event');
            }

            toast.success('Event added successfully!');
            router.push('/dashboard');
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach((e) => {
                    toast.error(e.message);
                });
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };

    return (
        <RoleProtectedPage requiredRoles={['admin', 'moderator']}>
            <div className="flex justify-center items-center min-h-screen">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-white p-6 rounded-lg shadow-md w-full max-w-md"
                >
                    <h1 className="text-2xl font-bold text-center">Add Event</h1>

                    <div className="space-y-4">
                        <Label>Event Type</Label>
                        <RadioGroup value={eventType} onValueChange={(value: 'single' | 'new_group' | 'existing_group') => setEventType(value)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id="single" />
                                <Label htmlFor="single">Single Event</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new_group" id="new_group" />
                                <Label htmlFor="new_group">Create New Group</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="existing_group" id="existing_group" />
                                <Label htmlFor="existing_group">Add to Existing Group</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {eventType === 'new_group' && (
                        <div className="space-y-2">
                            <Label htmlFor="groupName">Group Name</Label>
                            <Input
                                id="groupName"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                                required
                            />
                        </div>
                    )}

                    {eventType === 'existing_group' && (
                        <div className="space-y-2">
                            <Label htmlFor="eventGroup">Select Event Group</Label>
                            <Select
                                value={eventGroupId?.toString()}
                                onValueChange={(value) => setEventGroupId(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableGroups.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Event Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter event name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter event description"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                            id="startTime"
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                            id="endTime"
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="recurring"
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                        />
                        <Label htmlFor="recurring">Recurring Event</Label>
                    </div>

                    {isRecurring && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
                                <Select
                                    value={recurrencePattern}
                                    onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => 
                                        setRecurrencePattern(value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select pattern" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recurrenceInterval">Repeat Every</Label>
                                <Input
                                    id="recurrenceInterval"
                                    type="number"
                                    min="1"
                                    value={recurrenceInterval}
                                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recurrenceEndDate">End Date</Label>
                                <Input
                                    id="recurrenceEndDate"
                                    type="datetime-local"
                                    value={recurrenceEndDate}
                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        Add Event
                    </Button>
                </form>
            </div>
        </RoleProtectedPage>
    );
}