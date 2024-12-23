import React, { useState, useMemo, useRef, useEffect } from 'react';
import './App.css';

function DataTable() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [pasteContent, setPasteContent] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const cellInputRef = useRef(null);

  // Excel 内容粘贴处理
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    setPasteContent(pastedText);
    
    // 解析粘贴的表格内容
    const rows = pastedText.split('\n').map(row => row.split('\t'));
    
    if (rows.length > 0) {
      // 第一行作为表头
      const headers = rows[0].map(header => header.trim());
      
      // 转换为对象数组
      const tableData = rows.slice(1).map((row, index) => {
        const rowObj = {};
        headers.forEach((header, colIndex) => {
          rowObj[header] = row[colIndex] ? row[colIndex].trim() : '';
        });
        rowObj.id = index + 1; // 添加唯一 ID
        return rowObj;
      });

      setColumns(headers.map(header => ({
        key: header,
        label: header
      })));
      setData(tableData);
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 处理单元格复制粘贴
  const handleCellCopy = (e, rowIndex, columnKey) => {
    e.preventDefault();
    const selectedText = window.getSelection().toString();
    navigator.clipboard.writeText(selectedText);
  };

  const handleCellPaste = (e, rowIndex, columnKey) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // 如果是多行粘贴
    const pastedRows = pastedText.split('\n').map(row => row.split('\t'));
    
    const newData = [...data];
    pastedRows.forEach((rowData, offsetY) => {
      rowData.forEach((cellValue, offsetX) => {
        const targetRowIndex = rowIndex + offsetY;
        const targetColumnIndex = columns.findIndex(col => col.key === columnKey) + offsetX;
        
        if (targetRowIndex < newData.length && targetColumnIndex < columns.length) {
          const targetColumn = columns[targetColumnIndex].key;
          newData[targetRowIndex][targetColumn] = cellValue.trim();
        }
      });
    });

    setData(newData);
    setEditingCell(null);
  };

  // 处理单元格双击编辑
  const handleCellDoubleClick = (rowIndex, columnKey) => {
    setEditingCell({ row: rowIndex, column: columnKey });
  };

  // 处理单元格值变更
  const handleCellChange = (e, rowIndex, columnKey) => {
    const newData = [...data];
    newData[rowIndex][columnKey] = e.target.value;
    setData(newData);
  };

  // 处理单元格失去焦点
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // 排序逻辑
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // 搜索和过滤
  const filteredData = useMemo(() => {
    return sortedData.filter(row => 
      Object.values(row).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // 分页逻辑
  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * rowsPerPage;
    const lastPageIndex = firstPageIndex + rowsPerPage;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  // 排序处理器
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 行选择处理器
  const handleRowSelect = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  // 全选处理器
  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === paginatedData.length 
        ? [] 
        : paginatedData.map(row => row.id)
    );
  };

  // 添加行
  const addRow = () => {
    const newRow = { 
      id: data.length + 1, 
      ...columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}) 
    };
    setData([...data, newRow]);
  };

  // 添加列
  const addColumn = () => {
    const newColumnKey = `column_${columns.length + 1}`;
    const newColumns = [...columns, { key: newColumnKey, label: `新列${columns.length + 1}` }];
    
    const newData = data.map(row => ({
      ...row,
      [newColumnKey]: ''
    }));

    setColumns(newColumns);
    setData(newData);
  };

  // 初始化数据
  useEffect(() => {
    if (data.length === 0 && columns.length === 0) {
      const initialColumns = [
        { key: 'column1', label: '列1' },
        { key: 'column2', label: '列2' },
        { key: 'column3', label: '列3' }
      ];
      
      const initialData = [
        { 
          id: 1, 
          column1: '', 
          column2: '', 
          column3: '' 
        }
      ];

      setColumns(initialColumns);
      setData(initialData);
    }
  }, []);

  return (
    <div className="data-table-container">
      <div className="table-controls">
        <textarea 
          placeholder="从 Excel 中复制内容后粘贴到这里" 
          onPaste={handlePaste}
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          rows={3}
        />
        <div className="control-row">
          <input 
            type="text" 
            placeholder="搜索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={rowsPerPage} 
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            <option value={5}>5 条/页</option>
            <option value={10}>10 条/页</option>
            <option value={15}>15 条/页</option>
          </select>
          <button onClick={addRow}>添加行</button>
          <button onClick={addColumn}>添加列</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox"
                checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            {columns.map(column => (
              <th 
                key={column.key} 
                onClick={() => handleSort(column.key)}
              >
                {column.label} 
                {sortConfig.key === column.key && (
                  sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr 
              key={row.id} 
              className={selectedRows.includes(row.id) ? 'selected' : ''}
            >
              <td>
                <input 
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleRowSelect(row.id)}
                />
              </td>
              {columns.map(column => {
                const globalRowIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                const isEditing = 
                  editingCell && 
                  editingCell.row === globalRowIndex && 
                  editingCell.column === column.key;

                return (
                  <td 
                    key={column.key}
                    onDoubleClick={() => handleCellDoubleClick(globalRowIndex, column.key)}
                    onCopy={(e) => handleCellCopy(e, globalRowIndex, column.key)}
                    onPaste={(e) => handleCellPaste(e, globalRowIndex, column.key)}
                  >
                    {isEditing ? (
                      <input
                        ref={cellInputRef}
                        type="text"
                        value={row[column.key]}
                        onChange={(e) => handleCellChange(e, globalRowIndex, column.key)}
                        onBlur={handleCellBlur}
                        autoFocus
                      />
                    ) : (
                      row[column.key]
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          上一页
        </button>
        <span>第 {currentPage} 页</span>
        <button 
          onClick={() => setCurrentPage(prev => 
            prev * rowsPerPage < filteredData.length ? prev + 1 : prev
          )}
          disabled={currentPage * rowsPerPage >= filteredData.length}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <h1>Excel 数据表格</h1>
      <DataTable />
    </div>
  );
}

export default App;
