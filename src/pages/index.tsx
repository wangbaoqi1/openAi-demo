import LayoutPage from '@/layout/index';
import 'antd/dist/reset.css';

export default function IndexPage({ children }: any) {
  return (
    <LayoutPage>
      <div>{children}</div>
      <div id="subContainer"></div>
    </LayoutPage>
  );
}
