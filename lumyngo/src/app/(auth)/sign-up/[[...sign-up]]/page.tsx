import { SignUp } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LumynGo</span>
          </div>
          <p className="text-slate-400">Create your account</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton:
                "border-slate-700 text-slate-300 hover:bg-slate-800",
              formFieldLabel: "text-slate-300",
              formFieldInput:
                "bg-slate-800 border-slate-700 text-white placeholder-slate-500",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-500 text-white",
              footerActionLink: "text-blue-400 hover:text-blue-300",
              dividerLine: "bg-slate-700",
              dividerText: "text-slate-500",
            },
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
