"use client";

import { useState } from "react";
import { submitFeedback } from "@/services/social/feedbackService";
import { FeedbackType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: "bug", label: "خطأ / مشكلة", icon: "🐛" },
  { value: "suggestion", label: "اقتراح تحسين", icon: "💡" },
  { value: "praise", label: "تقييم إيجابي", icon: "💚" },
];

interface Props {
  /** Render a custom trigger element instead of the default button */
  trigger?: React.ReactNode;
}

export default function FeedbackDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "الرجاء كتابة رسالتك" });
      return;
    }
    setLoading(true);
    const { error } = await submitFeedback({ type, message });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
      return;
    }
    toast({ title: "شكراً على ملاحظاتك! 💚" });
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            ملاحظات
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>أرسل ملاحظاتك</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type selector */}
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as FeedbackType)}
            className="grid grid-cols-3 gap-2"
          >
            {TYPES.map((t) => (
              <div key={t.value}>
                <RadioGroupItem
                  value={t.value}
                  id={`fb-${t.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`fb-${t.value}`}
                  className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-muted p-3 cursor-pointer text-xs
                    peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-accent"
                >
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Message */}
          <Textarea
            placeholder="اكتب رسالتك هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "جاري الإرسال..." : "إرسال ✈️"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
