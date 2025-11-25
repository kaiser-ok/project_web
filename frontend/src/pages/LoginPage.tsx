import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Card, Typography, message, Spin } from 'antd';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import './LoginPage.css';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      const { user, accessToken, refreshToken } = response.data.data;

      setAuth(user, accessToken, refreshToken);
      message.success('登入成功！');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.response?.data?.error || '登入失敗，請稍後再試');
    }
  };

  const handleGoogleError = () => {
    message.error('Google 登入失敗，請稍後再試');
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-content">
          <Title level={2} className="login-title">
            專案管理系統
          </Title>
          <Text type="secondary" className="login-subtitle">
            使用 Google 帳號登入
          </Text>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="login-footer">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              登入即表示您同意我們的服務條款和隱私政策
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
