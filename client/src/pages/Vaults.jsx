import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Breadcrumb,
  Empty,
  Flex,
  Select,
  App as AntdApp
} from "antd";
import { PlusOutlined, SyncOutlined, SwapOutlined } from "@ant-design/icons";
import { ellipsisString, subgraphClient } from "@/utils";
import {
  VAULT_STATUS_OPTIONS,
  VAULT_STATUS,
  getVaultMetadata,
  buildVaultStatusWhere
} from "@/utils/vaultUtils";
import { GET_VAULTS_QUERY } from "@/utils/constants";

const { Text } = Typography;

dayjs.extend(relativeTime);

function formatTimestamp(timestamp) {
  return dayjs.unix(timestamp).format("MMM D, YYYY h:mm A");
}

export default function Vaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vaultFilter, setVaultFilter] = useState(VAULT_STATUS.ALL);
  const [sortOption, setSortOption] = useState("createdAt_desc");

  const navigate = useNavigate();
  const { address: account, isConnected } = useAppKitAccount();
  const { message } = AntdApp.useApp();

  async function getVaults() {
    if (!account) {
      setVaults([]);
      return;
    }

    setLoading(true);

    try {
      const vaultsWhere = buildVaultStatusWhere(vaultFilter, account);
      const [orderBy, orderDirection] = sortOption.split("_");
      const data = await subgraphClient.request(GET_VAULTS_QUERY, {
        first: 50,
        skip: 0,
        orderBy,
        orderDirection,
        where: vaultsWhere
      });

      setVaults(data?.vaults || []);
    } catch (error) {
      console.error("Error loading vaults:", error);
      message.error("Failed to load vaults. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getVaults();
  }, [account, vaultFilter, sortOption]);

  const columns = [
    {
      title: "ID",
      dataIndex: "idx",
      key: "idx",
      // sorter: (a, b) => a.idx - b.idx,
      render: (idx) => <Text strong>{`Vault #${idx}`}</Text>
    },
    {
      title: "Status",
      key: "status",
      render: (vault) => {
        const vaultMetadata = getVaultMetadata(vault);

        return (
          <Tag variant="outlined" color={vaultMetadata.color}>
            {vaultMetadata.label}
          </Tag>
        );
      }
    },
    {
      title: "Beneficiaries",
      dataIndex: "beneficiaries",
      key: "beneficiaries",
      render: (beneficiaries) => (
        <Space orientation="vertical" size="small">
          {beneficiaries?.length > 0
            ? beneficiaries.map((address) => (
                <Text key={address} ellipsis copyable={{ text: address }}>
                  {ellipsisString(address, 6, 4)}
                </Text>
              ))
            : "None"}
        </Space>
      )
    },
    {
      title: "Last Active",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      // sorter: (a, b) => a.lastActiveAt - b.lastActiveAt,
      render: (lastActiveAt) => {
        return (
          <Space orientation="vertical" size={0}>
            <Text>{formatTimestamp(lastActiveAt)}</Text>
            <Text type="secondary">{dayjs.unix(lastActiveAt).fromNow()}</Text>
          </Space>
        );
      }
    },
    {
      title: "Release At",
      key: "releaseAt",
      // sorter: (a, b) => a.releaseAt - b.releaseAt,
      render: ({ releaseAt, beneficiaries }) => {
        return (
          <Space orientation="vertical" size={0}>
            <Text>{formatTimestamp(releaseAt)}</Text>
            <Text type="secondary">
              {beneficiaries.length === 0
                ? "No beneficiaries configured"
                : dayjs.unix(releaseAt).fromNow()}
            </Text>
          </Space>
        );
      }
    },
    {
      title: "Created / Updated",
      key: "createdUpdated",
      // sorter: (a, b) => a.createdAt - b.createdAt,
      render: ({ createdAt, updatedAt }) => (
        <Space orientation="vertical" size={0}>
          <Text type="secondary">{formatTimestamp(createdAt)}</Text>
          <Text type="secondary">{formatTimestamp(updatedAt)}</Text>
        </Space>
      )
    }
  ];

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        style={{ marginBottom: 7 }}
        items={[{ title: <Link to="/">Home</Link> }, { title: "Vaults" }]}
      />
      <Card
        variant="borderless"
        title="Your Vaults"
        extra={
          <Space wrap>
            <Button
              title="Create Vault"
              shape="round"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate({ to: "/vaults/create" })}
            >
              Vault
            </Button>
            <Button
              type="text"
              title="Refresh"
              shape="circle"
              icon={<SyncOutlined spin={loading} />}
              onClick={getVaults}
            />
          </Space>
        }
      >
        <Flex
          gap={12}
          justify="space-between"
          align="center"
          wrap
          style={{ marginBottom: 16 }}
        >
          <Space wrap>
            {VAULT_STATUS_OPTIONS.map((filter) => (
              <Button
                key={filter.id}
                size="small"
                shape="round"
                type={vaultFilter === filter.id ? "primary" : "default"}
                onClick={() => setVaultFilter(filter.id)}
              >
                {filter.name}
              </Button>
            ))}
          </Space>

          <Select
            prefix={
              <SwapOutlined
                style={{
                  transform: "rotate(90deg) scaleY(-1)"
                }}
              />
            }
            defaultValue={sortOption}
            value={sortOption}
            style={{
              width: 180,
              maxWidth: "100%",
              marginLeft: "auto"
            }}
            placeholder="Sort by"
            options={[
              { value: "createdAt_desc", label: "Newest First" },
              { value: "createdAt_asc", label: "Oldest First" },
              { value: "lastActiveAt_desc", label: "Most Active" },
              { value: "lastActiveAt_asc", label: "Least Active" },
              { value: "releaseAt_asc", label: "Nearing Release" },
              { value: "releaseAt_desc", label: "Furthest Release" }
            ]}
            onChange={setSortOption}
          />
        </Flex>
        <Table
          loading={loading}
          dataSource={vaults}
          columns={columns}
          scroll={{ x: "max-content" }}
          rowKey="id"
          pagination={{
            responsive: true,
            hideOnSinglePage: true,
            showLessItems: true,
            pageSizeOptions: [5, 10, 25, 50, 100],
            showSizeChanger: true,
            defaultPageSize: 10
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isConnected
                    ? "No vaults match the selected filter yet. Try expanding your filter or create a new vault to get started."
                    : "Please connect your wallet to manage your vaults."
                }
              />
            )
          }}
          onRow={(vault) => ({
            onClick: () =>
              navigate({
                to: "/vaults/$id",
                params: { id: vault?.id }
              }),
            style: { cursor: "pointer" }
          })}
        />
      </Card>
    </Space>
  );
}
