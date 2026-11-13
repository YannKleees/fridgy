import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FloatingInput } from '@/components/FloatingInput';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const { error: signUpError } = await signUp(email, password, displayName);
    
    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }
    
    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-12 flex flex-col items-center">
          <img src={logo} alt="Fridgy logo" className="w-80 h-80 mix-blend-multiply dark:mix-blend-screen" />
          <h1 className="text-4xl font-bold text-foreground tracking-tight -mt-2">
            Fridgy
          </h1>
          <p className="text-muted-foreground mt-2">
            Create your account
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm text-center">
            Check your email - we've sent you a confirmation link to verify your account.
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <FloatingInput
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <FloatingInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FloatingInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="fancy"
            size="xl"
            className="w-full mt-8"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Footer text */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
