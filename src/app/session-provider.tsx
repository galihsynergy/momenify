'use client';

import { IProfileResponse } from '@/action/interfaces';
import { getUserProfile, submitPaymentProof } from '@/action/user-api';
import { uploadImage } from '@/components/forms/disney-form';
import { beforeUpload } from '@/components/forms/netflix-form';
import { SessionData } from '@/store/iron-session';
import { PlusOneOutlined } from '@mui/icons-material';
import { Button, Form, message, Modal, Upload } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the context type
interface SessionContextType {
  parsedSession: SessionData;
  userProfile: IProfileResponse | null;
  upgradeModal: {
    modalState: {
      visible: boolean;
      data: string;
    };
    setModalState: React.Dispatch<React.SetStateAction<any>>;
  };
}

// Create a default empty context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Create the SessionProvider component
const SessionProvider = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: string;
}) => {
  const parsedSession: SessionData = session ? JSON.parse(session) : {};
  const [userProfile, setUserProfile] = useState<IProfileResponse | null>(null);
  const [modalState, setModalState] = useState({
    visible: false,
    data: '',
  });
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = () => {
        // Update the form field directly
        let currentValues = form.getFieldValue('receipt') || [];
        currentValues = {
          ...currentValues,
          imageUrl: reader.result as string,
        };
        setImageUrl(reader.result as string);
        console.log(currentValues, '?');

        form.setFieldsValue({ receipt: currentValues });
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleSubmitPayment = async (value: any) => {
    try {
      setLoading(true);
      const paymentProofUri = await uploadImage(value.receipt.imageUrl);
      if (paymentProofUri) {
        const payload = {
          content_id: '',
          amount: 0,
          proof_payment_url: paymentProofUri,
        };

        const res = await submitPaymentProof(payload);
        if (res.success) {
          message.success('Successfully submitted payment proof!');
        } else {
          message.error('Something went wrong!');
        }
      }
    } catch {
      message.error('Error uploading image');
    }
    setLoading(false);
    setModalState({
      visible: false,
      data: '',
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    if (parsedSession.accessToken) {
      const handleGetProfile = async () => {
        const res = await getUserProfile();
        if (res.success) {
          setUserProfile(res.data);
        }
      };

      handleGetProfile();
    }
  }, []);
  return (
    <SessionContext.Provider
      value={{
        parsedSession,
        userProfile,
        upgradeModal: {
          modalState,
          setModalState,
        },
      }}>
      <Modal
        onCancel={() =>
          setModalState({
            visible: false,
            data: '',
          })
        }
        title="Upgrade Plan"
        open={modalState.visible}
        footer={null}>
        <div>
          <h1 className="text-[16px] font-bold">How to Upgrade Plan?</h1>
          <div className="mt-2">
            <p>1. Transfer IDR 15K to one of this bank account</p>
            <div className="ml-2">
              <p>089621490655 - GOPAY [GALIH PERMANA]</p>
              <p>3151609374 - BCA [GALIH PERMANA]</p>
            </div>
            <p className="my-1">
              2. Screenshot the payment receipt and upload it down below
            </p>
            <p className="my-1">
              3. Memoify admin will verify your payment and upgrade your plan
            </p>
            <p>3. You will get 5 quotas to use Memoify in premium mode</p>
          </div>
          <Form
            disabled={loading}
            form={form}
            layout="vertical"
            onFinish={(val) => handleSubmitPayment(val)}>
            <Form.Item name={'receipt'} className="!mt-[10px]">
              <Upload
                accept=".jpg, .jpeg, .png"
                name="avatar"
                listType="picture-card"
                maxCount={1}
                className="avatar-uploader"
                showUploadList={false}
                onChange={(info) => handleImageUpload(info)}
                beforeUpload={(file) => beforeUpload(file)}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className="w-full">
                    <PlusOneOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
      {children}
    </SessionContext.Provider>
  );
};

// Create a custom hook to access the context
export const useMemoifySession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context.parsedSession;
};

// Create a custom hook to access the context
export const useMemoifyProfile = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context.userProfile;
};

// Create a custom hook to access the context
export const useMemoifyUpgradePlan = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context.upgradeModal;
};

export default SessionProvider;