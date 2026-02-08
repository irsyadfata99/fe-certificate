import ThemeToggle from "../../components/common/ThemeToggle";

const Login = () => {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="card max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Login</h1>
          <ThemeToggle />
        </div>

        <p className="text-secondary mb-4">Theme testing</p>

        <div className="space-y-3">
          <div className="p-3 bg-surface rounded">
            <p className="text-primary">Primary Text</p>
          </div>
          <div className="p-3 bg-surface rounded">
            <p className="text-secondary">Secondary Text</p>
          </div>
          <div className="p-3 bg-success/10 rounded">
            <p className="text-success">Success Message</p>
          </div>
          <div className="p-3 bg-warning/10 rounded">
            <p className="text-warning">Warning Message</p>
          </div>
          <div className="p-3 bg-error/10 rounded">
            <p className="text-error">Error Message</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button className="btn btn-primary w-full">Primary Button</button>
          <button className="btn btn-secondary w-full">Secondary Button</button>
          <button className="btn btn-outline w-full">Outline Button</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
