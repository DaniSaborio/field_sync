type RegisterFooterProps = {
  onLoginClick: () => void;
};

export function RegisterFooter({ onLoginClick }: RegisterFooterProps) {
  return (
    <div className="mt-8 text-center">
      <span className="text-sm text-slate-400">¿Ya tienes una cuenta? </span>
      <button
        type="button"
        onClick={onLoginClick}
        className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300 hover:underline hover:underline-offset-4"
      >
        Inicia sesion
      </button>
    </div>
  );
}
