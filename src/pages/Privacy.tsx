import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const Privacy = () => {
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

        <h1 className="text-4xl font-bold mb-8 text-foreground">{t('privacy.title')}</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">{t('privacy.lastUpdated', { date: new Date().toLocaleDateString() })}</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.introduction.title')}</h2>
            <p>{t('privacy.sections.introduction.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.informationWeCollect.title')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">{t('privacy.sections.informationWeCollect.informationYouProvide.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.informationWeCollect.informationYouProvide.items.telegramId')}</li>
              <li>{t('privacy.sections.informationWeCollect.informationYouProvide.items.messages')}</li>
              <li>{t('privacy.sections.informationWeCollect.informationYouProvide.items.photos')}</li>
              <li>{t('privacy.sections.informationWeCollect.informationYouProvide.items.preferences')}</li>
              <li>{t('privacy.sections.informationWeCollect.informationYouProvide.items.paymentInfo')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">{t('privacy.sections.informationWeCollect.automaticallyCollected.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.informationWeCollect.automaticallyCollected.items.usageData')}</li>
              <li>{t('privacy.sections.informationWeCollect.automaticallyCollected.items.deviceInfo')}</li>
              <li>{t('privacy.sections.informationWeCollect.automaticallyCollected.items.sessionData')}</li>
              <li>{t('privacy.sections.informationWeCollect.automaticallyCollected.items.technicalData')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.howWeUseInfo.title')}</h2>
            <p>{t('privacy.sections.howWeUseInfo.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.howWeUseInfo.items.providePersonalize')}</li>
              <li>{t('privacy.sections.howWeUseInfo.items.maintainContext')}</li>
              <li>{t('privacy.sections.howWeUseInfo.items.processPayments')}</li>
              <li>{t('privacy.sections.howWeUseInfo.items.communicateUpdates')}</li>
              <li>{t('privacy.sections.howWeUseInfo.items.ensureSecurity')}</li>
              <li>{t('privacy.sections.howWeUseInfo.items.complyLegal')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.messagePrivacy.title')}</h2>
            <p>
              <strong>{t('privacy.sections.messagePrivacy.intro')}</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.messagePrivacy.usedFor.contextualResponses')}</li>
              <li>{t('privacy.sections.messagePrivacy.usedFor.maintainingContext')}</li>
              <li>{t('privacy.sections.messagePrivacy.usedFor.personalizing')}</li>
            </ul>
            <p className="mt-4 font-semibold">{t('privacy.sections.messagePrivacy.notUsedIntro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.messagePrivacy.notUsedFor.logged')}</li>
              <li>{t('privacy.sections.messagePrivacy.notUsedFor.usedForTraining')}</li>
              <li>{t('privacy.sections.messagePrivacy.notUsedFor.sharedWithThirdParties')}</li>
              <li>{t('privacy.sections.messagePrivacy.notUsedFor.accessibleToEmployees')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.dataStorageSecurity.title')}</h2>
            <p>{t('privacy.sections.dataStorageSecurity.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.dataStorageSecurity.items.encryptedTransmission')}</li>
              <li>{t('privacy.sections.dataStorageSecurity.items.secureStorage')}</li>
              <li>{t('privacy.sections.dataStorageSecurity.items.regularAudits')}</li>
              <li>{t('privacy.sections.dataStorageSecurity.items.limitedAccess')}</li>
            </ul>
            <p className="mt-4">{t('privacy.sections.dataStorageSecurity.disclaimer')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.dataRetention.title')}</h2>
            <p>{t('privacy.sections.dataRetention.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.dataRetention.items.accountInfo')}</li>
              <li>{t('privacy.sections.dataRetention.items.paymentHistory')}</li>
              <li>{t('privacy.sections.dataRetention.items.usageStats')}</li>
            </ul>
            <p className="mt-4">
              <strong>{t('privacy.sections.dataRetention.disclaimer')}</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.privacyRights.title')}</h2>
            <p>{t('privacy.sections.privacyRights.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.sections.privacyRights.items.accessData')}</li>
              <li>{t('privacy.sections.privacyRights.items.requestDeletion')}</li>
              <li>{t('privacy.sections.privacyRights.items.correctInfo')}</li>
              <li>{t('privacy.sections.privacyRights.items.objectProcessing')}</li>
              <li>{t('privacy.sections.privacyRights.items.dataPortability')}</li>
            </ul>
            <p className="mt-4">
              {t('privacy.sections.privacyRights.contact')}{" "}
              <a 
                href="https://t.me/nextwifesupport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @nextwifesupport
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.childrensPrivacy.title')}</h2>
            <p>{t('privacy.sections.childrensPrivacy.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.internationalTransfers.title')}</h2>
            <p>{t('privacy.sections.internationalTransfers.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.cookiesTracking.title')}</h2>
            <p>{t('privacy.sections.cookiesTracking.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.changesToPolicy.title')}</h2>
            <p>{t('privacy.sections.changesToPolicy.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{t('privacy.sections.contactUs.title')}</h2>
            <p>{t('privacy.sections.contactUs.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li>
                <strong>{t('privacy.sections.contactUs.supportChannel')}</strong>{" "}
                <a 
                  href="https://t.me/nextwifesupport" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @nextwifesupport
                </a>
              </li>
            </ul>
          </section>

          <section className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> {t('privacy.note')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
