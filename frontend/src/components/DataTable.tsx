import React from 'react';
import { Edit, Trash2, CheckSquare, Square, Eye } from 'lucide-react';
import type { Task, Project } from '../types';

interface Column {
  key: string;
  header: string;
  width: string;
  minWidth?: string;
  render?: (item: any) => React.ReactNode;
}

interface DataTableProps {
  data: (Task | Project)[];
  columns: Column[];
  selectedItems: Set<number>;
  onItemSelect: (itemId: number) => void;
  onSelectAll: () => void;
  onEdit?: (item: Task | Project) => void;
  onDelete?: (itemId: number) => void;
  onViewDetail?: (item: Task | Project) => void;
  selectAll: boolean;
  showCheckbox?: boolean;
  type: 'tasks' | 'projects';
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  selectedItems,
  onItemSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onViewDetail,
  selectAll,
  showCheckbox = true,
  type
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {showCheckbox && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <button
                  onClick={onSelectAll}
                  className="flex items-center justify-center w-4 h-4"
                >
                  {selectAll ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width} whitespace-nowrap`}
                style={column.minWidth ? { minWidth: column.minWidth } : undefined}
              >
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete || onViewDetail) && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 whitespace-nowrap">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 cursor-default">
              {showCheckbox && (
                <td className="px-6 py-4 w-12">
                  <button
                    onClick={() => onItemSelect(item.id!)}
                    className="flex items-center justify-center w-4 h-4"
                  >
                    {selectedItems.has(item.id!) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
              )}
              {columns.map((column) => (
                <td 
                  key={column.key} 
                  className={`px-6 py-4 ${column.width}`}
                  style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                >
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
              <td className="px-6 py-4 w-40 text-sm font-medium space-x-4">
                {onViewDetail && (
                  <button
                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                    title="查看详情"
                    onClick={() => onViewDetail(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {onEdit && (
                  <button
                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                    title="编辑"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="text-red-600 hover:text-red-900 cursor-pointer"
                    title="删除"
                    onClick={() => onDelete(item.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable; 