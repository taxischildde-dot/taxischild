import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { TripForm } from '../components/trips/TripForm';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export default function NewTripPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, company } = useAuth();
  const existingTrip = id && company ? db.trips.getForCompany(company.id, id) : undefined;
  const canEdit = !!existingTrip && !!user && (user.role === 'admin' || existingTrip.driverId === user.id);

  if (id && !canEdit) return <Navigate to="/trips" replace />;

  return (
    <div>
      <TopBar title={existingTrip ? 'Fahrt bearbeiten' : 'Neue Fahrt'} subtitle="Buchung in wenigen Schritten erfassen" />
      <div className="px-4 pt-4">
        <TripForm
          existingTrip={existingTrip}
          onSaved={() => navigate('/trips')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
