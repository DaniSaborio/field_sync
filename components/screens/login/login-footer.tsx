type LoginFooterProps = {
  onRegisterClick: () => void;
};

export function LoginFooter({ onRegisterClick }: LoginFooterProps) {
  return (
    <div className="mt-6 text-center font-sans text-sm text-muted">
      ¿No tenés una cuenta?{" "}
      <button
        type="button"
        onClick={onRegisterClick}
        className="font-bold text-black underline decoration-1 underline-offset-4 transition hover:decoration-2"
      >
        Registrate gratis
      </button>
    </div>
  );
}
