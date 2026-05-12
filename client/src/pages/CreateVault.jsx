import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Encryptable } from "@cofhe/sdk";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, isAddress } from "ethers";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Space,
  Typography,
  Breadcrumb,
  App as AntdApp,
  Spin
} from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  afternoteContract,
  encryptText,
  getCofheClient,
  uint8ArrayToBigInt,
  uint8ArrayToHex,
  ellipsisString
} from "@/utils";
import { SEPOLIA_CHAIN_ID } from "@/utils/constants";

const { Text } = Typography;

export default function CreateVault() {
  const [loading, setLoading] = useState(false);
  const [beneficiaryInput, setBeneficiaryInput] = useState("");
  const [beneficiaries, setBeneficiaries] = useState([]);

  const { address: account, isConnected, caipAddress } = useAppKitAccount();
  // caipAddress format: eip155:<chainid>:<address>
  const selectedChainId = caipAddress?.split(":")[1];
  const { walletProvider } = useAppKitProvider("eip155");
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();

  const limits = { beneficiaries: 3 };

  function handleAddBeneficiary() {
    const value = beneficiaryInput.trim();

    if (!isAddress(value)) {
      message.error("Please enter a valid Ethereum address.");
      return;
    }

    if (
      beneficiaries.some((item) => item.toLowerCase() === value.toLowerCase())
    ) {
      message.warning("Beneficiary already added.");
      return;
    }

    if (beneficiaries.length >= limits.beneficiaries) {
      message.warning(`Maximum ${limits.beneficiaries} beneficiaries allowed.`);
      return;
    }

    setBeneficiaries((prev) => [...prev, value]);
    setBeneficiaryInput("");
  }

  function handleRemoveBeneficiary(address) {
    setBeneficiaries((prev) => prev.filter((item) => item !== address));
  }

  async function onFinish(values) {
    if (!isConnected || !walletProvider) {
      return message.error("Please connect your wallet to create a vault.");
    }

    if (selectedChainId !== SEPOLIA_CHAIN_ID) {
      return message.error("Please switch to Sepolia network.");
    }

    setLoading(true);

    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const client = await getCofheClient(ethersProvider, signer);
      const { aesKeyBytes, ivBytes, cipherTextBytes } = await encryptText(
        values.note
      );

      const aesKeyBigInt = uint8ArrayToBigInt(aesKeyBytes);
      const ivBigInt = uint8ArrayToBigInt(ivBytes);
      const cipherTextHex = uint8ArrayToHex(cipherTextBytes);

      const [encryptedKeyInput, encryptedIvInput] = await client
        .encryptInputs([
          Encryptable.uint128(aesKeyBigInt),
          Encryptable.uint128(ivBigInt)
        ])
        .execute();

      const tx = await afternoteContract
        .connect(signer)
        .addVault(
          encryptedKeyInput,
          encryptedIvInput,
          cipherTextHex,
          beneficiaries
        );
      const receipt = await tx.wait();

      const addedLog = receipt.logs
        .map((log) => {
          try {
            return afternoteContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log) => log?.name === "VaultAdded");
      const idx = addedLog?.args?.idx?.toString() || "0";
      const vaultId = `${account.toLowerCase()}-${idx}`;

      message.success("Vault created successfully.");
      form.resetFields();
      setBeneficiaries([]);
      setBeneficiaryInput("");
      navigate({ to: "/vaults/$id", params: { id: vaultId } });
    } catch (error) {
      console.error("Error creating vault:", error);
      message.error(
        `Failed to create vault. ${error?.shortMessage || error?.message || "Please try again later."}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        style={{ marginBottom: 7 }}
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/vaults">Vaults</Link> },
          { title: "Create" }
        ]}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Spin spinning={loading} description="Saving vault. Please wait...">
          <Row gutter={[24, 24]} align="top">
            <Col xs={24} lg={16}>
              <Card
                variant="outlined"
                title="Create Vault"
                extra={
                  <Space size="small">
                    <Button
                      icon={<SaveOutlined />}
                      type="primary"
                      shape="round"
                      htmlType="submit"
                      loading={loading}
                    >
                      Save
                    </Button>
                    <Link to="/vaults">
                      <Button shape="round">Cancel</Button>
                    </Link>
                  </Space>
                }
              >
                <Form.Item
                  name="note"
                  rules={[
                    { required: true, message: "Please enter the note text." }
                  ]}
                  style={{ marginBottom: 0 }}
                  extra="Note will be encrypted locally before being sent on-chain."
                >
                  <Input.TextArea
                    rows={16}
                    placeholder="Write the note you want to protect"
                    showCount
                    maxLength={200}
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Space orientation="vertical" style={{ width: "100%" }} size={16}>
                <Card
                  title="Beneficiaries"
                  size="small"
                  extra={`${beneficiaries.length} of ${limits.beneficiaries}`}
                >
                  <Input
                    placeholder="0x..."
                    maxLength={42}
                    value={beneficiaryInput}
                    onChange={(e) => setBeneficiaryInput(e.target.value)}
                    onPressEnter={handleAddBeneficiary}
                    disabled={beneficiaries.length >= limits.beneficiaries}
                    suffix={
                      <Button
                        type="primary"
                        shape="round"
                        icon={<PlusOutlined />}
                        onClick={handleAddBeneficiary}
                        disabled={beneficiaries.length >= limits.beneficiaries}
                      >
                        Add
                      </Button>
                    }
                  />

                  <div style={{ marginTop: 16 }}>
                    {beneficiaries.length === 0 ? (
                      <Empty
                        description="No beneficiaries yet. You can still create a private personal note."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <Space
                        orientation="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        {beneficiaries.map((address) => (
                          <Alert
                            key={address}
                            type="info"
                            title={
                              <Text
                                type="secondary"
                                copyable={{ text: address }}
                              >
                                {ellipsisString(address, 10, 6)}
                              </Text>
                            }
                            action={
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveBeneficiary(address)}
                              />
                            }
                          />
                        ))}
                      </Space>
                    )}
                  </div>
                </Card>
              </Space>
            </Col>
          </Row>
        </Spin>
      </Form>
    </Space>
  );
}
