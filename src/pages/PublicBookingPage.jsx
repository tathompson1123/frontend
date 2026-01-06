import { useParams } from 'react-router-dom';
import PublicBooking from '../components/PublicBooking';

export default function PublicBookingPage() {
  const { businessId } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  return (
    <PublicBooking 
      businessId={businessId} 
      apiUrl={apiUrl} 
    />
  );
}
