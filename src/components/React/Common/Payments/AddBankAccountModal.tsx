import { useEffect, useMemo, useState } from 'react';
import Dropdown from '@/components/React/Common/Dropdown';
import { getTranslation, type SupportedLanguages } from '@/utils/i18n';
import { AppModal } from '../../Profile/components/AppModal';
import AppButton from '@/components/React/Common/AppButton';
import { filterNumericInput } from '@/utils/preventNonNumeric';

import {
  getPaymentCatalogs,
  type CatalogsResponse,
  type BankCatalog,
  type AccountTypeCatalog,
} from '@/services/payments/catalogs';

export type AddBankForm = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  dni: string;
  dniComplement?: string;
  alias: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: AddBankForm) => void;
  lang?: SupportedLanguages;
  error?: string | null;
  isSubmitting?: boolean;
}

export default function AddBankAccountModal({
  isOpen,
  onClose,
  onVerify,
  lang = 'es',
  error = null,
  isSubmitting = false,
}: Props) {
  const t = getTranslation(lang);
  const [catalogs, setCatalogs] = useState<CatalogsResponse | null>(null);
  const [loadingCat, setLoadingCat] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [dni, setDni] = useState('');
  const [dniComplement, setDniComplement] = useState('');
  const [alias, setAlias] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBankName('');
      setAccountType('');
      setAccountNumber('');
      setHolderName('');
      setDni('');
      setDniComplement('');
      setAlias('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const c = new AbortController();
    setLoadingCat(true);
    setCatErr(null);

    getPaymentCatalogs(c.signal)
      .then((data) => {
        const uniqBanks = Array.from(
          new Map<string, BankCatalog>(
            data.banks.map((b) => [b.id, b])
          ).values()
        );
        const uniqAccountTypes = Array.from(
          new Map<string, AccountTypeCatalog>(
            data.accountTypes.map((a) => [a.id, a])
          ).values()
        );
        setCatalogs({ banks: uniqBanks, accountTypes: uniqAccountTypes });
      })
      .catch((e) => setCatErr(e?.message ?? 'Error cargando catálogos'))
      .finally(() => setLoadingCat(false));

    return () => c.abort();
  }, [isOpen]);

  const bankOptions = catalogs?.banks?.map((b) => b.name) ?? [];
  const accountTypeOptions = (catalogs?.accountTypes ?? []).map((a) =>
    t.earnings.accountTypes &&
    Object.prototype.hasOwnProperty.call(t.earnings.accountTypes, a.id)
      ? t.earnings.accountTypes[a.id as keyof typeof t.earnings.accountTypes]
      : a.name
  );
  const canSubmit =
    !loadingCat &&
    !isSubmitting &&
    !!bankName.trim() &&
    !!accountType.trim() &&
    accountNumber.trim().length >= 3 &&
    accountNumber.trim().length <= 20 &&
    !!holderName.trim() &&
    holderName.trim().length <= 100 &&
    !!dni.trim() &&
    dni.trim().length <= 15 &&
    !!alias.trim() &&
    alias.trim().length <= 50;

  const norm = (s: string) => s.trim().toLowerCase();

  const bankNameToId = useMemo(() => {
    const map = new Map<string, string>();
    (catalogs?.banks ?? []).forEach((b) => map.set(norm(b.name), b.id));
    return map;
  }, [catalogs?.banks]);

  const accountTypeNameToId = useMemo(() => {
    const map = new Map<string, string>();
    (catalogs?.accountTypes ?? []).forEach((a) => {
      const original = a.name;
      const translated =
        t.earnings.accountTypes &&
        Object.prototype.hasOwnProperty.call(t.earnings.accountTypes, a.id)
          ? t.earnings.accountTypes[
              a.id as keyof typeof t.earnings.accountTypes
            ]
          : a.name;

      map.set(norm(original), a.id);
      map.set(norm(translated), a.id);
    });
    return map;
  }, [catalogs?.accountTypes, t]);

  const bankIdFromName = (name: string) => bankNameToId.get(norm(name)) ?? '';
  const accountTypeIdFromName = (name: string) =>
    accountTypeNameToId.get(norm(name)) ?? '';

  return (
    <AppModal
      id="add-bank-account"
      isOpen={isOpen}
      onClose={onClose}
      showHeader={true}
      title={t.earnings.addBankAccount}
      titleSize="text-xl"
      maxWidth="max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]"
      maxHeight="max-h-[92vh]"
      maxHeightBody="max-h-[66vh]"
      footer={
        <div className="flex items-center justify-between">
          <AppButton
            type="button"
            label={t.common.cancel}
            variant="link"
            size="sm"
            onClick={onClose}
            className="!text-neutral hover:!text-base-content underline"
          />
          <AppButton
            type="button"
            label={t.earnings.setUp}
            onClick={() =>
              onVerify({
                bankName: bankIdFromName(bankName),
                accountType: accountTypeIdFromName(accountType),
                accountNumber,
                holderName,
                dni,
                dniComplement,
                alias,
              })
            }
            size="md"
            rounded
            fontSemibold
            disabled={!canSubmit}
          />
        </div>
      }
    >
      <div className="space-y-4 pt-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start">
              <div className="flex-1">{error}</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-neutral block text-sm">
            {t.earnings.financialInstitution}
          </label>
          <Dropdown
            options={bankOptions}
            value={bankName}
            onChange={setBankName}
            lang={lang}
            className="w-full"
            buttonClassName="rounded-[16px]"
            buttonHeight="h-12"
            labelFontSize="text-base font-normal"
            disabled={loadingCat || !!catErr}
            placeholder={t.earnings.financialInstitution}
          />
        </div>

        {/* Account type */}
        <div className="space-y-2">
          <label className="text-neutral block text-sm">
            {t.earnings.accountType}
          </label>
          <Dropdown
            options={accountTypeOptions}
            value={accountType}
            onChange={setAccountType}
            lang={lang}
            className="w-full"
            buttonClassName="rounded-[16px]"
            buttonHeight="h-12"
            labelFontSize="text-base font-normal"
            disabled={loadingCat || !!catErr}
            placeholder={t.earnings.accountType}
          />
        </div>

        {/*Account number*/}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-neutral block text-sm">
              {t.earnings.accountNumber}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(filterNumericInput(e.target.value))
              }
              placeholder="2354325532"
              minLength={3}
              maxLength={20}
              className="border-base-200 focus:border-primary h-12 w-full rounded-full border bg-white px-4 text-base outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-neutral block text-sm">
              {t.earnings.holderName}
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Juan Ignacio Guzmán Palenque"
              maxLength={100}
              className="border-base-200 focus:border-primary h-12 w-full rounded-full border bg-white px-4 text-base outline-none"
            />
          </div>
        </div>

        {/* Document Number and Complement */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-neutral block text-sm">
              {t.earnings.documentNumber}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(filterNumericInput(e.target.value))}
              placeholder="12345678"
              maxLength={15}
              className="border-base-200 focus:border-primary h-12 w-full rounded-full border bg-white px-4 text-base outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-neutral block text-sm">
              {t.earnings.complement}{' '}
              <span className="text-xs text-gray-400">
                ({t.common.optional})
              </span>
            </label>
            <input
              type="text"
              value={dniComplement}
              onChange={(e) => setDniComplement(e.target.value)}
              placeholder="1A"
              maxLength={10}
              className="border-base-200 focus:border-primary h-12 w-full rounded-full border bg-white px-4 text-base outline-none"
            />
          </div>
        </div>

        {/* Alias */}
        <div className="space-y-2">
          <label className="text-neutral block text-sm">
            {t.earnings.alias}
          </label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Juan BCP"
            maxLength={50}
            className="border-base-200 focus:border-primary h-12 w-full rounded-full border bg-white px-4 text-base outline-none"
          />
        </div>
      </div>
    </AppModal>
  );
}
