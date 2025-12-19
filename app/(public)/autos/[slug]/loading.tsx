'use client';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">Cargando vehículo...</p>
      </div>
    </div>
  );
}
