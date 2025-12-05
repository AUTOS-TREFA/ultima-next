'use client';

import {
  InteractiveStepper,
  InteractiveStepperContent,
  InteractiveStepperDescription,
  InteractiveStepperIndicator,
  InteractiveStepperItem,
  InteractiveStepperSeparator,
  InteractiveStepperTitle,
  InteractiveStepperTrigger,
} from '@/components/ui/interactive-stepper';

interface CardProps {
  title: string;
  description: string;
}

const Card: React.FC<CardProps> = ({ title, description }) => (
  <div className="w-full rounded-lg border border-gray-700 bg-gray-900 p-4">
    <span className="font-semibold text-gray-300">{title}</span>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

const InteractiveStepperHorizontal = () => {
  return (
    <InteractiveStepper defaultValue={2} className="w-11/12">
      <InteractiveStepperItem completed>
        <InteractiveStepperTrigger>
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle>Registro exitoso</InteractiveStepperTitle>
            <InteractiveStepperDescription>A few days ago</InteractiveStepperDescription>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator />
      </InteractiveStepperItem>

      <InteractiveStepperItem>
        <InteractiveStepperTrigger>
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle>Paso actual</InteractiveStepperTitle>
            <InteractiveStepperDescription>Estas aqui</InteractiveStepperDescription>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator />
      </InteractiveStepperItem>

      <InteractiveStepperItem>
        <InteractiveStepperTrigger>
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle>Completado</InteractiveStepperTitle>
            <InteractiveStepperDescription>On your way</InteractiveStepperDescription>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator />
      </InteractiveStepperItem>

      <InteractiveStepperItem>
        <InteractiveStepperTrigger>
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle>Completado</InteractiveStepperTitle>
            <InteractiveStepperDescription>Info relevante</InteractiveStepperDescription>
          </div>
        </InteractiveStepperTrigger>
      </InteractiveStepperItem>

      <InteractiveStepperContent step={1}>
        <Card title={'Registro exitoso'} description={'Creaste tu cuenta y completaste los datos de tu perfil'} />
      </InteractiveStepperContent>

      <InteractiveStepperContent step={2}>
        <Card
          title={'Perfilamiento Bancario'}
          description={'Estimated processing time: 1-2 business days'}
        />
      </InteractiveStepperContent>

      <InteractiveStepperContent step={3}>
        <Card title={'Llenar Solicitud'} description={'Tracking: #ABC123XYZ'} />
      </InteractiveStepperContent>

      <InteractiveStepperContent step={4}>
        <Card title={'Enviar solicitud'} description={'Delivered to your location'} />
      </InteractiveStepperContent>
    </InteractiveStepper>
  );
};

export default InteractiveStepperHorizontal;

