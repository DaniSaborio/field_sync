type RegisterFooterProps = {
  onLoginClick: () => void;
};

export function RegisterFooter({ onLoginClick }: RegisterFooterProps) {
  return (
    <div className="mt-6 text-center font-sans text-sm text-muted">
      ¿Ya tenés una cuenta?{" "}
      <button
        type="button"
        onClick={onLoginClick}
        className="font-bold text-black underline decoration-1 underline-offset-4 transition hover:decoration-2"
      >
        Iniciá sesión
      </button>
    </div>
  );
}
