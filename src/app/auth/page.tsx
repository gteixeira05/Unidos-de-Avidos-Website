"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password";
import { notifyAuthSessionChanged } from "@/lib/auth-session-events";
import { safeRedirectPath } from "@/lib/auth";
import PrivacyConsentField from "@/components/PrivacyConsentField";
import MarketingConsentField from "@/components/MarketingConsentField";

type PasswordState = ReturnType<typeof validatePassword>;

function PasswordField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-24 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          aria-label={show ? "Ocultar password" : "Mostrar password"}
        >
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginTwoFactorCode, setLoginTwoFactorCode] = useState("");
  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] =
    useState("");
  const [passwordState, setPasswordState] = useState<PasswordState | null>(
    null
  );

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotNewPasswordConfirm, setForgotNewPasswordConfirm] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptPrivacyRegister, setAcceptPrivacyRegister] = useState(false);
  const [acceptMarketingRegister, setAcceptMarketingRegister] = useState(false);

  const nextParam = searchParams.get("next");

  // Se já estiver autenticado, redirecionar (respeita ?next=)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.user) {
          router.replace(safeRedirectPath(nextParam));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router, nextParam]);

  function handlePasswordChange(value: string) {
    setRegisterPassword(value);
    setPasswordState(validatePassword(value));
  }

  function handleForgotPasswordChange(value: string) {
    setForgotNewPassword(value);
  }

  async function handleForgotStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar código.");
      setSuccess(data.message ?? "Código enviado. Verifique o seu email.");
      setForgotStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (forgotNewPassword !== forgotNewPasswordConfirm) {
      setError("A confirmação da password não corresponde.");
      return;
    }
    const validation = validatePassword(forgotNewPassword);
    if (!validation.isValid) {
      setError("A password não cumpre os requisitos mínimos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotCode,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao redefinir password.");
      setSuccess(data.message ?? "Password alterada. Já pode iniciar sessão.");
      setMode("login");
      setForgotEmail("");
      setForgotCode("");
      setForgotNewPassword("");
      setForgotNewPasswordConfirm("");
      setForgotStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (twoFactorChallengeId) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            twoFactorChallengeId,
            twoFactorCode: loginTwoFactorCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erro ao validar código.");
        }

        setSuccess("Login efetuado com sucesso.");
        notifyAuthSessionChanged();
        setTwoFactorChallengeId(null);
        setLoginTwoFactorCode("");
        setTimeout(() => router.push(safeRedirectPath(nextParam)), 500);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao efetuar login.");
      }

      if (data?.requiresTwoFactor && data?.twoFactorChallengeId) {
        setTwoFactorChallengeId(data.twoFactorChallengeId);
        setLoginTwoFactorCode("");
        setSuccess("Código enviado para o seu email. Introduza-o para concluir o login.");
        return;
      }

      setSuccess("Login efetuado com sucesso.");
      notifyAuthSessionChanged();
      setTimeout(() => router.push(safeRedirectPath(nextParam)), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (registerPassword !== registerPasswordConfirm) {
      setError("A confirmação da password não corresponde.");
      return;
    }

    const validation = validatePassword(registerPassword);
    if (!validation.isValid) {
      setError("A password não cumpre todos os requisitos mínimos.");
      setPasswordState(validation);
      return;
    }

    if (!acceptPrivacyRegister) {
      setError("Tem de aceitar a política de privacidade para criar conta.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          password: registerPassword,
          emailComunicacoesConsent: acceptMarketingRegister,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao registar.");
      }

      setSuccess("Conta criada com sucesso. Já pode iniciar sessão.");
      setMode("login");
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      setPasswordState(null);
      setAcceptPrivacyRegister(false);
      setAcceptMarketingRegister(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  }

  const currentPasswordState = passwordState ?? validatePassword("");

  const passwordRequirements = [
    {
      key: "minLength" as const,
      label: "Pelo menos 8 caracteres",
      ok: currentPasswordState.minLength,
    },
    {
      key: "hasUpper" as const,
      label: "Uma letra maiúscula (A-Z)",
      ok: currentPasswordState.hasUpper,
    },
    {
      key: "hasLower" as const,
      label: "Uma letra minúscula (a-z)",
      ok: currentPasswordState.hasLower,
    },
    {
      key: "hasNumber" as const,
      label: "Um número (0-9)",
      ok: currentPasswordState.hasNumber,
    },
    {
      key: "hasSymbol" as const,
      label: "Um símbolo (!, ?, @, #, ...)",
      ok: currentPasswordState.hasSymbol,
    },
  ];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center text-sm font-medium text-[#00923f] hover:underline"
      >
        ← Voltar
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
      <p className="text-gray-600">
        Crie a sua conta ou inicie sessão para aceder à área reservada.
      </p>

      <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setSuccess("");
            setTwoFactorChallengeId(null);
            setLoginTwoFactorCode("");
            setAcceptPrivacyRegister(false);
          }}
          className={`flex-1 rounded-full px-4 py-2 ${
            mode === "login"
              ? "bg-white text-[#00923f] shadow-sm"
              : "text-gray-500"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 rounded-full px-4 py-2 ${
            mode === "register"
              ? "bg-white text-[#00923f] shadow-sm"
              : "text-gray-500"
          }`}
        >
          Criar conta
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {mode === "forgot" ? (
          forgotStep === 1 ? (
            <form onSubmit={handleForgotStep1} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="text-sm text-gray-600 hover:text-[#00923f]"
              >
                ← Voltar ao login
              </button>
              <h2 className="text-lg font-semibold text-[#00923f]">Recuperar password</h2>
              <p className="text-sm text-gray-600">
                Indique o seu email. Enviaremos um código de 6 dígitos para confirmar a sua identidade.
              </p>
              <p className="text-xs leading-relaxed text-gray-500">
                O email será utilizado apenas para envio do código de recuperação, nos termos da nossa{" "}
                <Link href="/privacidade" className="font-medium text-[#00923f] underline">
                  política de privacidade
                </Link>
                .
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#00923f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#007a33] disabled:opacity-60"
              >
                {loading ? "A enviar..." : "Enviar código"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotStep2} className="space-y-4">
              <h2 className="text-lg font-semibold text-[#00923f]">Inserir código e nova password</h2>
              <p className="text-sm text-gray-600">
                Introduza o código de 6 dígitos recebido no email <strong>{forgotEmail}</strong> e defina a nova password.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Código</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-lg tracking-widest focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
                />
              </div>
              <PasswordField
                label="Nova password"
                value={forgotNewPassword}
                onChange={handleForgotPasswordChange}
              />
              <PasswordField
                label="Confirmar nova password"
                value={forgotNewPasswordConfirm}
                onChange={setForgotNewPasswordConfirm}
              />
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <p className="mb-2 font-semibold">Requisitos: 8+ caracteres, maiúscula, minúscula, número, símbolo.</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#00923f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#007a33] disabled:opacity-60"
              >
                {loading ? "A redefinir..." : "Redefinir password"}
              </button>
              <button
                type="button"
                onClick={() => { setForgotStep(1); setError(""); setSuccess(""); }}
                className="w-full text-sm text-gray-600 hover:text-[#00923f]"
              >
                ← Voltar e pedir novo código
              </button>
            </form>
          )
        ) : mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-[#00923f]">Entrar</h2>
            {twoFactorChallengeId ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  Enviámos um código de 6 dígitos para o email do administrador.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Código de verificação
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={loginTwoFactorCode}
                    onChange={(e) => setLoginTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-lg tracking-widest focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorChallengeId(null);
                    setLoginTwoFactorCode("");
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-sm text-gray-600 hover:text-[#00923f]"
                >
                  ← Voltar ao email/password
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
                  />
                </div>
                <PasswordField
                  label="Password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                />
              </>
            )}
            {error && (
              <p className="text-sm text-red-600" aria-live="polite">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600" aria-live="polite">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#00923f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#007a33] disabled:opacity-60"
            >
              {loading ? "A entrar..." : twoFactorChallengeId ? "Validar código" : "Entrar"}
            </button>
            {!twoFactorChallengeId && (
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setSuccess(""); setForgotEmail(loginEmail); setForgotStep(1); }}
                className="w-full pt-2 text-sm text-gray-600 hover:text-[#00923f]"
              >
                Esqueci a password
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-[#00923f]">
              Criar conta
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telemóvel (opcional)
              </label>
              <input
                type="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#00923f] focus:outline-none focus:ring-1 focus:ring-[#00923f]"
              />
            </div>

            <PasswordField
              label="Password"
              value={registerPassword}
              onChange={handlePasswordChange}
            />

            <PasswordField
              label="Confirmar password"
              value={registerPasswordConfirm}
              onChange={setRegisterPasswordConfirm}
            />

            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
              <p className="mb-2 font-semibold text-gray-800">
                Requisitos mínimos da password:
              </p>
              <ul className="space-y-1">
                {passwordRequirements.map((req) => (
                  <li key={req.key} className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                        req.ok
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={req.ok ? "text-green-700" : "text-gray-600"}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <PrivacyConsentField
              id="auth-register-privacy"
              purpose="account"
              checked={acceptPrivacyRegister}
              onChange={setAcceptPrivacyRegister}
              disabled={loading}
            />

            <MarketingConsentField
              id="auth-register-marketing-consent"
              checked={acceptMarketingRegister}
              onChange={setAcceptMarketingRegister}
              disabled={loading}
            />

            {error && (
              <p className="text-sm text-red-600" aria-live="polite">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600" aria-live="polite">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#00923f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#007a33] disabled:opacity-60"
            >
              {loading ? "A criar conta..." : "Criar conta"}
            </button>
          </form>
        )}
      </div>

      {/* Link de voltar já está em cima */}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
          <p className="text-gray-600">A carregar…</p>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
