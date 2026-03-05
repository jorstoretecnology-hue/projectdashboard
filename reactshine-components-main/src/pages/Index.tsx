import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HeroBanner } from "@/components/HeroBanner";
import { AppearanceSection } from "@/components/AppearanceSection";
import { ModulesSection } from "@/components/ModulesSection";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <HeroBanner />
        
        <div className="space-y-6">
          <AppearanceSection />
          <Separator />
          <ModulesSection />
          <Separator />
          <ArchitectureSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
