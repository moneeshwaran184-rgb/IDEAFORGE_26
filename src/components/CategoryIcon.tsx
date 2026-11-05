import React from 'react';
import {
  Cone,
  Lightbulb,
  Trash2,
  Droplets,
  Bus,
  Trees,
  Volume2,
  Accessibility,
  HelpCircle,
  Bike,
  SunMedium,
  Recycle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Cone':
      return <Cone {...props} />;
    case 'Lightbulb':
      return <Lightbulb {...props} />;
    case 'Trash2':
      return <Trash2 {...props} />;
    case 'Droplets':
      return <Droplets {...props} />;
    case 'Bus':
      return <Bus {...props} />;
    case 'Trees':
      return <Trees {...props} />;
    case 'Volume2':
      return <Volume2 {...props} />;
    case 'Accessibility':
      return <Accessibility {...props} />;
    case 'Bike':
      return <Bike {...props} />;
    case 'SunMedium':
      return <SunMedium {...props} />;
    case 'Recycle':
      return <Recycle {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'HelpCircle':
    default:
      return <HelpCircle {...props} />;
  }
};

