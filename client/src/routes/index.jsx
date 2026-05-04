import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import {
  Button,
  Card,
  Col,
  Collapse,
  Row,
  Space,
  Typography,
  Divider,
  Tag
} from "antd";
import {
  RocketOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  PlusOutlined
} from "@ant-design/icons";

const { Paragraph, Text, Title } = Typography;

const howItWorks = [
  {
    title: "Create an encrypted vault",
    description:
      "Write a private note. AES-128 encryption happens client-side before anything is stored."
  },
  {
    title: "Keep your vault active",
    description:
      "Call ping whenever needed to prove activity and prevent release."
  },
  {
    title: "Auto-release on inactivity",
    description:
      "After inactivity delay, release grants listed beneficiaries decrypt access."
  }
];

const securityHighlights = [
  {
    icon: <LockOutlined />,
    title: "End-to-end encrypted",
    description: "Vault content stays encrypted at rest and in transit."
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "FHE access control",
    description:
      "Encrypted key access is granted on-chain after release rules are met."
  },
  {
    icon: <TeamOutlined />,
    title: "Multi-beneficiary",
    description:
      "Choose trusted beneficiaries who can decrypt when conditions are met."
  },
  {
    icon: <ClockCircleOutlined />,
    title: "Inactivity based",
    description:
      "Release is time-based and predictable, not manual admin-controlled."
  }
];

const vaultExamples = [
  "Recovery phrases and wallet instructions",
  "Financial account handover notes",
  "Insurance or legal guidance for family",
  "Private personal messages"
];

const faqItems = [
  {
    key: "1",
    label: "What gets encrypted?",
    children:
      "Your vault note is encrypted client-side with AES-128, and the AES key is protected with CoFHE primitives."
  },
  {
    key: "2",
    label: "Can I update beneficiaries later?",
    children:
      "Yes. You can update vault beneficiaries and encrypted payload through the update flow."
  },
  {
    key: "3",
    label: "When can release be called?",
    children:
      "Release is possible only after the inactivity delay has passed since your last ping."
  }
];

export const Route = createFileRoute("/")({
  component: HomeComponent
});

function HomeComponent() {
  const navigate = useNavigate();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space
          orientation="vertical"
          size="large"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Tag color="blue">Privacy-Preserving Dead-Man Switch</Tag>
          <Title level={2} style={{ margin: 0, fontSize: "32px" }}>
            Your Digital Safety Net
          </Title>
          <Paragraph
            type="secondary"
            style={{ marginBottom: 0, fontSize: "16px" }}
          >
            A privacy-preserving dead-man switch for sensitive instructions,
            wallet details, and messages that should reach the right people only
            when needed.
          </Paragraph>

          {isConnected ? (
            <Space size="middle" wrap justify="center">
              <Button
                shape="round"
                size="large"
                onClick={() => navigate({ to: "/vaults" })}
                icon={<ArrowRightOutlined />}
              >
                My Vaults
              </Button>
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={() => navigate({ to: "/vaults/create" })}
                icon={<PlusOutlined />}
              >
                Create Vault
              </Button>
            </Space>
          ) : (
            <Button
              type="primary"
              shape="round"
              size="large"
              onClick={() => open({ view: "Connect" })}
              icon={<RocketOutlined />}
            >
              Get Started
            </Button>
          )}
        </Space>
      </Card>

      <Card title="How It Works">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          {howItWorks.map((item, index) => (
            <Row key={index} gutter={16} align="middle">
              <Col flex="0 0 auto">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold"
                  }}
                >
                  {index + 1}
                </div>
              </Col>
              <Col flex="1">
                <Space
                  orientation="vertical"
                  size={0}
                  style={{ width: "100%" }}
                >
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                </Space>
              </Col>
              {index < howItWorks.length - 1 && (
                <Col span={24}>
                  <Divider style={{ margin: "8px 0" }} />
                </Col>
              )}
            </Row>
          ))}
        </Space>
      </Card>

      <Card title="Privacy and Security First">
        <Row gutter={[16, 16]}>
          {securityHighlights.map((feature) => (
            <Col xs={24} md={12} key={feature.title}>
              <Card size="small" hoverable style={{ height: "100%" }}>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Space>
                    <span style={{ fontSize: "24px", color: "#667eea" }}>
                      {feature.icon}
                    </span>
                    <Text strong>{feature.title}</Text>
                  </Space>
                  <Text type="secondary">{feature.description}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="What You Can Store">
        <Row gutter={[16, 16]}>
          {vaultExamples.map((item) => (
            <Col xs={24} sm={12} md={6} key={item}>
              <Card size="small" hoverable style={{ height: "100%" }}>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <FileProtectOutlined
                    style={{ fontSize: "24px", color: "#764ba2" }}
                  />
                  <Text strong>{item}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="FAQ">
        <Collapse items={faqItems} />
      </Card>
    </Space>
  );
}
