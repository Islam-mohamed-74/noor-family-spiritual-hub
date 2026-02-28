import { useState } from "react";
import {
  useNudges,
  useMarkNudgeRead,
  useMarkAllNudgesRead,
} from "@/hooks/useNudges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NudgeInbox() {
  const [open, setOpen] = useState(false);

  const { data: nudges = [], refetch } = useNudges();
  const markRead = useMarkNudgeRead();
  const markAllRead = useMarkAllNudgesRead();

  const unreadCount = nudges.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => markRead.mutate(id);
  const handleMarkAllRead = () => markAllRead.mutate();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    return `منذ ${diffDays} ي`;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) refetch();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <div dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">التشجيعات</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleMarkAllRead}
              >
                <Check className="h-3 w-3" />
                قراءة الكل
              </Button>
            )}
          </div>

          {/* Nudge list */}
          <div className="max-h-80 overflow-y-auto">
            {nudges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                لا توجد تشجيعات بعد
              </div>
            ) : (
              nudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors",
                    !nudge.read
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => !nudge.read && handleMarkRead(nudge.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !nudge.read && "font-medium")}>
                      {nudge.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(nudge.timestamp)}
                    </p>
                  </div>
                  {!nudge.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
