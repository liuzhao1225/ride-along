"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

const MIN_PASSWORD_LEN = 6;

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "邮箱或密码错误";
  if (m.includes("user already registered")) return "该邮箱已注册，请直接登录";
  // Supabase 控制台「密码要求」为「大小写+数字+符号」时的英文长提示，改为一句可读说明
  if (
    m.includes("password should contain") ||
    m.includes("at least one character of each")
  ) {
    return "密码需同时包含：小写字母、大写字母、数字与常用符号（如 !@#$ 等）";
  }
  if (m.includes("pwned") || m.includes("haveibeenpwned")) {
    return "该密码过于常见，请换一个";
  }
  if (m.includes("password")) return message;
  if (m.includes("email")) return message;
  return message;
}

interface PasswordAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabase: SupabaseClient;
  /** 登录或注册成功后（会话已建立） */
  onAuthSuccess?: () => void;
}

export function PasswordAuthDialog({
  open,
  onOpenChange,
  supabase,
  onAuthSuccess,
}: PasswordAuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setMode("login");
    setNickname("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setError(null);
    setPending(false);
  }

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("请输入有效邮箱");
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`密码至少 ${MIN_PASSWORD_LEN} 位`);
      return;
    }
    setPending(true);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (e) {
        setError(mapAuthError(e.message));
        return;
      }
      onAuthSuccess?.();
      onOpenChange(false);
      reset();
    } finally {
      setPending(false);
    }
  }

  async function handleRegister() {
    setError(null);
    const nick = nickname.trim();
    if (!nick) {
      setError("请填写昵称");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("请输入有效邮箱");
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`密码至少 ${MIN_PASSWORD_LEN} 位`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setPending(true);
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: nick },
        },
      });
      if (e) {
        setError(mapAuthError(e.message));
        return;
      }
      if (data.session) {
        onAuthSuccess?.();
        onOpenChange(false);
        reset();
      } else {
        setError(
          "注册成功。若控制台开启了邮箱确认，请查收邮件后再登录。"
        );
        setMode("login");
        setPassword("");
        setPasswordConfirm("");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="size-5" />
            </span>
            {mode === "login" ? "登录" : "注册"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            className={cn(
              "flex-1 shadow-none",
              mode !== "login" && "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            登录
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "ghost"}
            className={cn(
              "flex-1 shadow-none",
              mode !== "register" && "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            注册
          </Button>
        </div>

        {mode === "login" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">邮箱</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">密码</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleLogin}
              disabled={pending}
            >
              {pending ? "登录中…" : "登录"}
            </Button>
          </div>
        )}

        {mode === "register" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-nick">昵称</Label>
              <Input
                id="auth-nick"
                autoComplete="nickname"
                placeholder="群内显示的名字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">邮箱</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">密码</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password2">确认密码</Label>
              <Input
                id="reg-password2"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleRegister}
              disabled={pending}
            >
              {pending ? "注册中…" : "注册"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
