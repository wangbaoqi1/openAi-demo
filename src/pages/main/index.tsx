import { SetStateAction, useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import showdown from 'showdown';
import {
  Spin,
  Button,
  message,
  Alert,
  Space,
  Image,
  Upload,
  Modal,
  Tooltip,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '@/api/index.js';
import styles from './index.less';
import moment from 'moment';
const converter = new showdown.Converter();

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function IndexPage() {
  const [userInput, setUserInput] = useState('');
  const [apiOutput, setApiOutput] = useState('结果将在这里输出……');
  const [inputError, setInputError] = useState('');
  const [type, setType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileobj, setFileObj] = useState<any>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const getLocal = (str: string) => localStorage.getItem(str);
  const setLocal = (key: string, value: string) =>
    localStorage.setItem(key, value);
  const getPurview = () => {
    const num = String(+(getLocal('count') || 0) + 1);
    const week = moment().day();
    if (getLocal('week') === String(week)) {
      +num < 6 && setLocal('count', num);
    }
    if (getLocal('week') !== String(week)) {
      setLocal('week', String(week));
      setLocal('count', '0');
    }
    if (location.href.includes('?lmh')) {
      setLocal('count', '0');
    }
    return num;
  };
  const onUserChangedText = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setInputError('');
    setUserInput(event.target.value);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1),
    );
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    console.log(newFileList, 'img111111');

    setFileList(newFileList);
  };

  const callGenerateEndpoint = async (type: string) => {
    setType(type);
    setInputError('');
    try {
      if (userInput !== '') {
        const num = +getPurview();
        if (num > 100) {
          message.info('免费使用权限已经到期，请联系管理员添加权限');
          return;
        }
        setApiOutput(`请耐心等待……`);
        setLoading(true);
        let url = '/v1/completions';
        let param: any = {
          // 配置一
          model: 'text-davinci-003',
          prompt: userInput,
          max_tokens: 4000,
          temperature: 1,
          top_p: 1,
          n: 1,
          best_of: 4,
          stream: false,
        };
        if (type === 'img') {
          url = '/v1/images/generations';
          param = {
            // 配置四
            prompt: userInput,
            n: 1,
            size: '1024x1024',
          };
        }
        if (type === 'imgEdit') {
          url = '/v1/images/edits';
          param = {
            // 配置五
            image: fileList[0].originFileObj,
            prompt: 'A cute baby sea otter wearing a beret.',
            n: '2',
            size: '1024x1024',
            response_format: 'url',
            user: +new Date(),
          };
        }
        if (type === 'msg') {
          param = {
            // 配置二
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userInput }],
            max_tokens: 4000,
            temperature: 1,
            top_p: 1,
            n: 1,
            stream: false,
          };
        }

        if (type === 'msg') {
          param = {
            // 配置三
            model: 'text-davinci-edit-001',
            input: userInput,
            instruction: 'Fix the spelling mistakes',
          };
        }

        // fetch请求
        // const apiKey = "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";
        const apiKey = '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';
        //https://api.openai.com/v1/completions
        //http://openai.lianmeihu.com/v1/completions
        const response = await fetch(`https://api.openai.com/${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(param),
        });
        const res = await response.json();
        if (type === 'text') {
          //配置一
          const output = res?.choices[0] || {};
          const formattedText = output.text;
          // 配置二
          // const output = res?.choices[0] || {};
          // const formattedText = output.message.content;
          const sanitizedOutput = sanitizeHtml(
            converter.makeHtml(formattedText),
          );
          setApiOutput(`${sanitizedOutput}`);
        }
        if (type === 'img') {
          setApiOutput(res?.data[0].url);
        }
        setLoading(false);
      } else {
        setInputError('请输入需要实现的功能');
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };
  console.log('apiOutput', apiOutput);

  return (
    <div className={styles.main}>
      <Alert
        message={`openai接口每天有免费的5次的使用权限`}
        type="warning"
        closable
      />
      <div className={styles.openLeft}>
        <div className="">
          <h3 className={styles.openTitle}>openAl接口测试</h3>
          <div className={styles.openForm}>
            <textarea
              name=""
              className={styles.openFormText}
              placeholder="请输入"
              value={userInput}
              onChange={onUserChangedText}
            ></textarea>
            {inputError !== '' && (
              <div className={styles.errorTips}>{inputError}</div>
            )}
            <Space className={styles.openBtn}>
              <Button
                type="primary"
                loading={type === 'text' && loading}
                onClick={() => callGenerateEndpoint('text')}
              >
                openAi-text
              </Button>
              <Button
                type="primary"
                loading={type === 'img' && loading}
                onClick={() => callGenerateEndpoint('img')}
              >
                openAi生成图片
              </Button>
              <Tooltip title="功能暂未开放">
                <Button
                  type="primary"
                  disabled={true}
                  loading={type === 'imgEdit' && loading}
                  onClick={() => callGenerateEndpoint('imgEdit')}
                >
                  openAi修改图片
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      </div>
      <div className={styles.openRight}>
        <h3>内容输出区</h3>
        <div className={styles.content}>
          <Spin size={'large'} spinning={loading} />
          {apiOutput && (
            <div className="output">
              <div className="output-content">
                {(type === 'img' && <Image src={apiOutput} />) || (
                  <div
                    style={{
                      padding: '10px',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: apiOutput,
                    }}
                  ></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
