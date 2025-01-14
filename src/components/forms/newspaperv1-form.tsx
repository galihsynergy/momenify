'use client';
import { Button, Form, Image, Input, message, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useState } from 'react';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import {
  LoadingOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from 'antd/es/form/Form';
import { revalidateRandom } from '@/lib/revalidate';
import { useMemoifyProfile } from '@/app/session-provider';
import { createContent } from '@/action/user-api';
import { beforeUpload, getBase64, getBase64Multiple } from './netflix-form';
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const Newspaperv1Form = ({
  loading,
  setLoading,
  modalState,
  setModalState,
  selectedTemplate,
}: {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  modalState: {
    visible: boolean;
    data: string;
  };
  setModalState: React.Dispatch<
    React.SetStateAction<{
      visible: boolean;
      data: string;
    }>
  >;
  selectedTemplate: {
    id: string;
    route: string;
  };
}) => {
  const [imageUrl, setImageUrl] = useState<string>();
  const [uploadLoading, setUploadLoading] = useState(false);

  const profile = useMemoifyProfile();

  const [form] = useForm();

  const handleSetStoryImageURI = (
    payload: { uri: string; uid: string },
    formName: string,
    fieldIndex?: number
  ) => {
    const currentValues = form.getFieldValue('stories') || [];
    currentValues[fieldIndex!] = {
      ...currentValues[fieldIndex!],
      imageUrl: payload.uri,
    };
    form.setFieldsValue({ stories: currentValues });
  };

  const handleSetJumbotronImageURI = (
    payload: { uri: string; uid: string },
    formName: string
  ) => {
    form.setFieldValue(formName, payload);
    setImageUrl(payload.uri);
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const handleSubmit = async (val: any) => {
    const { jumbotronImage, title, subTitle, stories } = val;
    setLoading(true);

    const json_text = {
      jumbotronImage: jumbotronImage?.uri,
      title,
      subTitle,
      stories: stories,
    };

    const payload = {
      template_id: selectedTemplate.id,
      detail_content_json_text: JSON.stringify(json_text),
    };

    const res = await createContent(payload);
    if (res.success) {
      const userLink = selectedTemplate.route + '/' + res.data;
      message.success('Successfully created!');
      form.resetFields();
      setModalState({
        visible: true,
        data: userLink as string,
      });
    } else {
      message.error('Something went wrong!');
    }

    setLoading(false);

    return;
    await getBase64(
      jumbotronImage.file.originFileObj as FileType,
      async (url) => {
        try {
        } catch {
          message.error('Error uploading image');
        }
        setLoading(false);
      }
    );
  };

  return (
    <div>
      <Form
        disabled={loading}
        form={form}
        layout="vertical"
        onFinish={(val) => handleSubmit(val)}>
        <Form.Item
          rules={[
            {
              required: true,
              message: 'Please input image!',
            },
          ]}
          name={'jumbotronImage'}
          label="Breaking News Image">
          <Upload
            accept=".jpg, .jpeg, .png"
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={async (file) => {
              setUploadLoading(true);
              await beforeUpload(
                file,
                profile
                  ? ['premium', 'pending'].includes(profile.type as any)
                    ? 'premium'
                    : 'free'
                  : 'free',
                handleSetJumbotronImageURI,
                'jumbotronImage'
              );
              setUploadLoading(false);
            }}>
            {imageUrl ? (
              <img src={imageUrl} alt="avatar" style={{ width: '100%' }} />
            ) : (
              uploadButton
            )}
          </Upload>
        </Form.Item>
        <Form.Item
          rules={[{ required: true, message: 'Please input title!' }]}
          name={'title'}
          label="Title">
          <Input size="large" placeholder="Happy birthday to my cats" />
        </Form.Item>
        <Form.Item
          rules={[{ required: true, message: 'Please input subtitle!' }]}
          name={'subTitle'}
          label="Sub Title">
          <TextArea
            size="large"
            placeholder="This is how me express love. In the meantime you will understand how my brain works. lorem ipsum"
          />
        </Form.Item>
        <Form.List name="stories">
          {(fields, { add, remove }) => (
            <>
              <div className="mt-[10px] mb-[5px]">
                <h3 className="text-[15px] font-semibold">Featured Stories</h3>

                <p className="text-[13px] text-gray-600 max-w-[400px]">
                  Upload a moment that you want to share with your partner,
                  image of memorable moment or anything
                </p>
              </div>
              <div className="flex flex-wrap gap-[10px] ">
                {fields.map(({ key, name, fieldKey, ...restField }, index) => (
                  <div key={key} className="flex gap-[8px] items-start w-full">
                    <div className="max-w-[200px] w-full">
                      <Form.Item
                        {...restField}
                        className="!my-0 w-full"
                        rules={[
                          {
                            required: true,
                            message: 'Please upload a moment',
                          },
                        ]}
                        name={[name, 'imageUrl']}>
                        <Upload
                          accept=".jpg, .jpeg, .png"
                          name="avatar"
                          listType="picture-card"
                          className="avatar-uploader"
                          showUploadList={false}
                          beforeUpload={(file) =>
                            beforeUpload(
                              file,
                              profile
                                ? ['premium', 'pending'].includes(
                                    profile.type as any
                                  )
                                  ? 'premium'
                                  : 'free'
                                : 'free',
                              handleSetStoryImageURI,
                              'stories',
                              index
                            )
                          }
                          // onChange={(info) => handleImageUpload(info, index)}
                        >
                          {form.getFieldValue('stories')?.[index]?.imageUrl ? (
                            <img
                              src={
                                form.getFieldValue('stories')?.[index]?.imageUrl
                              }
                              alt="avatar"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div className="w-full">
                              <PlusOutlined />
                              <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                          )}
                        </Upload>
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, 'title']}
                        rules={[
                          {
                            required: true,
                            message: 'Please input the title!',
                          },
                        ]}>
                        <Input placeholder="e.g., News 1" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'desc']}
                        rules={[
                          {
                            required: true,
                            message: 'Please input the desc!',
                          },
                        ]}>
                        <TextArea placeholder="lorem ipsum dolor sit amet" />
                      </Form.Item>
                      <Button
                        danger
                        type="default"
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="large"
                type="primary"
                onClick={() => {
                  if (profile?.quota === 0) {
                    if (fields.length <= 1) {
                      add();
                    } else {
                      message.error('You can only add 2 moments');
                    }
                  } else {
                    if (fields.length <= 5) {
                      add();
                    } else {
                      message.error('Limit reached');
                    }
                  }
                }}
                icon={<PlusOutlined />}
                className="!rounded-[50px] !bg-black !text-white my-[12px] !text-[13px]">
                Add Stories
              </Button>

              <p className="text-[13px] text-gray-600 max-w-[400px]">
                Account with <span className="font-bold">free</span> plan can
                only add 2 moment of episode. To add up to 6 moment of episode,
                upgrade to <span className="font-bold">premium</span> plan.
              </p>
            </>
          )}
        </Form.List>

        <div className="flex justify-end ">
          <Button
            className="!bg-black"
            loading={loading || uploadLoading}
            type="primary"
            htmlType="submit"
            size="large">
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Newspaperv1Form;
