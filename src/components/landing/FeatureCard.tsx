import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-[0_0_24px_hsl(142_70%_50%/0.06)]">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary mb-4 group-hover:glow-green transition-shadow duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};
