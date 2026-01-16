import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back">
            {t('common.backToHome')}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">{t('terms.title')}</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">{t('terms.lastUpdated', { date: new Date().toLocaleDateString() })}</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.acceptanceOfTerms.title')}</h2>
            <p>{t('terms.sections.acceptanceOfTerms.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.ageRequirement.title')}</h2>
            <p>{t('terms.sections.ageRequirement.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.serviceDescription.title')}</h2>
            <p>{t('terms.sections.serviceDescription.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.sections.serviceDescription.items.textConversations')}</li>
              <li>{t('terms.sections.serviceDescription.items.photoMediaInteractions')}</li>
              <li>{t('terms.sections.serviceDescription.items.voiceVideoContent')}</li>
              <li>{t('terms.sections.serviceDescription.items.personalizedExperiences')}</li>
            </ul>
            <p className="mt-4">{t('terms.sections.serviceDescription.disclaimer')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.userConduct.title')}</h2>
            <p>{t('terms.sections.userConduct.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.sections.userConduct.items.illegalPurposes')}</li>
              <li>{t('terms.sections.userConduct.items.reverseEngineer')}</li>
              <li>{t('terms.sections.userConduct.items.shareCredentials')}</li>
              <li>{t('terms.sections.userConduct.items.harass')}</li>
              <li>{t('terms.sections.userConduct.items.illegalContent')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.intellectualProperty.title')}</h2>
            <p>{t('terms.sections.intellectualProperty.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.privacyAndData.title')}</h2>
            <p>{t('terms.sections.privacyAndData.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.disclaimerOfWarranties.title')}</h2>
            <p>{t('terms.sections.disclaimerOfWarranties.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.sections.disclaimerOfWarranties.items.uninterruptedService')}</li>
              <li>{t('terms.sections.disclaimerOfWarranties.items.accuracyOfContent')}</li>
              <li>{t('terms.sections.disclaimerOfWarranties.items.meetRequirements')}</li>
            </ul>
            <p className="mt-4 font-semibold">{t('terms.sections.disclaimerOfWarranties.disclaimer')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.limitationOfLiability.title')}</h2>
            <p>{t('terms.sections.limitationOfLiability.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.subscriptionAndPayment.title')}</h2>
            <p>{t('terms.sections.subscriptionAndPayment.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.termination.title')}</h2>
            <p>{t('terms.sections.termination.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.changesToTerms.title')}</h2>
            <p>{t('terms.sections.changesToTerms.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('terms.sections.contact.title')}</h2>
            <p>
              {t('terms.sections.contact.content')}
              <a 
                href="https://t.me/nextwifesupport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                @nextwifesupport
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
