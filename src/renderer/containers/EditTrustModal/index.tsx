import React, {FC, useMemo, useState} from 'react';
import {Account, Bank, ConfirmationValidator} from 'thenewboston';

import {FormInput} from '@renderer/components/FormComponents';
import Modal from '@renderer/components/Modal';
import {useNavigationalHistory} from '@renderer/hooks';
import {ManagedNode, NodeType} from '@renderer/types';
import {formatAddressFromNode} from '@renderer/utils/address';
import yup from '@renderer/utils/forms/yup';
import {displayToast} from '@renderer/utils/toast';

interface ComponentProps {
  close(): void;
  requestingNode: ManagedNode;
  targetIdentifier: string;
  targetType: 'accounts' | 'banks' | 'validators';
  trust: string;
}

const EditTrustModal: FC<ComponentProps> = ({close, requestingNode, targetIdentifier, trust, targetType}) => {
  const {reload} = useNavigationalHistory();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const initialValues = useMemo(() => ({trust}), [trust]);
  type FormValues = typeof initialValues;
  const validationSchema = yup.object().shape({
    trust: yup
      .number()
      .required('This field is required')
      .min(0, 'Must be a positive amount')
      .max(100, 'Must be less than 100'),
  });

  const handleSubmit = async (values: FormValues): Promise<void> => {
    try {
      setSubmitting(true);

      const networkIdKeyPair = new Account(requestingNode.nid_signing_key);
      const address = formatAddressFromNode(requestingNode);

      let node: Bank | ConfirmationValidator;

      node = new Bank(address);
      const nodeConfig = await node.getConfig();

      if (nodeConfig.node_type === NodeType.bank) {
        if (targetType === 'accounts') {
          node.updateAccountTrust(targetIdentifier, Number(values.trust), networkIdKeyPair);
        } else if (targetType === 'banks') {
          node.updateBankTrust(targetIdentifier, Number(values.trust), networkIdKeyPair);
        } else {
          node.updateValidatorTrust(targetIdentifier, Number(values.trust), networkIdKeyPair);
        }
      } else {
        node = new ConfirmationValidator(address);

        if (targetType === 'banks') {
          node.updateBankTrust(targetIdentifier, Number(values.trust), networkIdKeyPair);
        } else {
          node.updateValidatorTrust(targetIdentifier, Number(values.trust), networkIdKeyPair);
        }
      }

      reload();
    } catch (error) {
      displayToast('An error occurred');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      className="EditTrustModal"
      close={close}
      header="Edit Trust"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      submitButton="Save"
      submitting={submitting}
      validationSchema={validationSchema}
    >
      <FormInput focused label="Trust" name="trust" required type="number" />
    </Modal>
  );
};

export default EditTrustModal;
