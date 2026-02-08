import PropTypes from "prop-types";
import { ChevronUp, ChevronDown } from "lucide-react";
import Spinner from "./Spinner";

/**
 * Table Component
 * Data table dengan sorting, pagination, dan styling sesuai theme
 *
 * Features:
 * - Sortable columns
 * - Loading state
 * - Empty state
 * - Responsive
 * - Striped rows (optional)
 * - Hover effect
 */
const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  striped = false,
  hoverable = true,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection,
  onRowClick,
  className = "",
}) => {
  // =====================================================
  // HANDLE SORT
  // =====================================================

  const handleSort = (column) => {
    if (!sortable || !column.sortable || !onSort) return;

    const newDirection =
      sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";

    onSort(column.key, newDirection);
  };

  // =====================================================
  // RENDER SORT ICON
  // =====================================================

  const SortIcon = ({ column }) => {
    if (!sortable || !column.sortable) return null;

    const isActive = sortColumn === column.key;

    return (
      <span className="ml-2 inline-flex">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <ChevronUp className="w-4 h-4 opacity-30" />
        )}
      </span>
    );
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {/* Table Head */}
        <thead className="bg-surface border-b-2 border-secondary/20">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-6 py-3
                  text-left text-xs font-semibold text-primary uppercase tracking-wider
                  ${column.sortable && sortable ? "cursor-pointer select-none hover:bg-primary/5" : ""}
                  ${column.width ? column.width : ""}
                `}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  {column.label}
                  <SortIcon column={column} />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-base divide-y divide-secondary/10">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`
                ${striped && rowIndex % 2 === 1 ? "bg-surface/30" : ""}
                ${hoverable ? "hover:bg-surface cursor-pointer" : ""}
                transition-colors duration-150
              `}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td
                  key={`${row.id || rowIndex}-${column.key}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-primary"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =====================================================
// PROP TYPES
// =====================================================

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      width: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  sortable: PropTypes.bool,
  onSort: PropTypes.func,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(["asc", "desc"]),
  onRowClick: PropTypes.func,
  className: PropTypes.string,
};

export default Table;
