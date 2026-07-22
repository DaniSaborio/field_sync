type LoginFooterProps = {
  onRegisterClick: () => void;
};

export function LoginFooter({ onRegisterClick }: LoginFooterProps) {
  return (
    <div className="mt-8 text-center">
      <span className="text-sm text-slate-400">¿No tienes una cuenta? </span>
      <button
        type="button"
        onClick={onRegisterClick}
        className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300 hover:underline hover:underline-offset-4"
      >
        Registrate gratis
      </button>
    </div>
  );
}