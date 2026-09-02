import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex items-center justify-center bg-canvas p-4">
      <Card className="max-w-md w-full text-center py-12 px-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-err-bg flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-err" />
        </div>
        <h1 className="text-xl font-bold text-ink">Access Denied</h1>
        <p className="text-sm text-ink-muted">You don&apos;t have permission to access this page.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </Card>
    </div>
  );
}