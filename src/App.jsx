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
  const [copiedData, setCopiedData] = useState(null);
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
    setCopiedData({
      value: selectedText,
      row: rowIndex,
      column: columnKey
    });
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

  // 复制粘贴事件监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          handleCellCopy(e, editingCell.row, editingCell.column);
        } else if (e.key === 'v') {
          handleCellPaste(e, editingCell.row, editingCell.column);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell]);

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
  const [data, setData] = useState([
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '']
  ]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [columnTypes, setColumnTypes] = useState({});
  const [conditionalRules, setConditionalRules] = useState([]);
  const [copiedData, setCopiedData] = useState(null);
  const inputRef = useRef(null);

  // 数据验证
  const validateCell = (value, type) => {
    switch(type) {
      case 'number':
        return !isNaN(Number(value));
      case 'email':
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      case 'date':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  };

  // 复制单元格内容
  const handleCopy = (e) => {
    if (selectedCell) {
      const copiedValue = data[selectedCell.row][selectedCell.col];
      navigator.clipboard.writeText(copiedValue);
      setCopiedData({
        value: copiedValue,
        row: selectedCell.row,
        col: selectedCell.col
      });
    }
  };

  // 粘贴单元格内容
  const handlePaste = (e) => {
    if (copiedData && selectedCell) {
      const newData = [...data];
      newData[selectedCell.row][selectedCell.col] = copiedData.value;
      setData(newData);
      saveHistory(newData);
      setCopiedData(null);
    } else {
      navigator.clipboard.readText().then(clipText => {
        if (selectedCell) {
          const newData = [...data];
          newData[selectedCell.row][selectedCell.col] = clipText;
          setData(newData);
          saveHistory(newData);
        }
      });
    }
  };

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          handleCopy(e);
        } else if (e.key === 'v') {
          handlePaste(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, data]);

  // 单元格格式化
  const formatters = {
    currency: (value) => `$${Number(value).toFixed(2)}`,
    percentage: (value) => `${(Number(value) * 100).toFixed(2)}%`,
    date: (value) => new Date(value).toLocaleDateString()
  };

  // 历史记录管理
  const saveHistory = (newData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newData]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
    }
  };

  // 处理单元格编辑
  const handleCellEdit = (rowIndex, colIndex, value) => {
    const newData = [...data];
    const columnType = columnTypes[colIndex] || 'text';
    
    if (validateCell(value, columnType)) {
      newData[rowIndex][colIndex] = value;
      setData(newData);
      saveHistory(newData);
    } else {
      alert(`Invalid input for column type: ${columnType}`);
    }
  };

  // 导出到Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "table_export.xlsx");
  };

  // 从Excel导入
  const importFromExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const importedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setData(importedData);
      saveHistory(importedData);
    };
    reader.readAsBinaryString(file);
  };

  // 添加行
  const addRow = () => {
    const newData = [...data, Array(data[0].length).fill('')];
    setData(newData);
    saveHistory(newData);
  };

  // 添加列
  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    setData(newData);
    saveHistory(newData);
  };

  // 条件格式化
  const getConditionalStyle = (value, rowIndex, colIndex) => {
    for (let rule of conditionalRules) {
      if (rule.condition(value, rowIndex, colIndex)) {
        return rule.style;
      }
    }
    return {};
  };

  // 设置列类型
  const setColumnType = (colIndex, type) => {
    setColumnTypes(prev => ({...prev, [colIndex]: type}));
  };

  // 添加条件格式规则
  const addConditionalRule = (condition, style) => {
    setConditionalRules(prev => [...prev, { condition, style }]);
  };

  return (
    <div className="App">
      <h1>Excel 数据表格</h1>
      <DataTable />
      <div className="excel-container">
        <div className="toolbar">
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={exportToExcel}>Export</button>
          <input type="file" accept=".xlsx" onChange={importFromExcel} />
          <button onClick={addRow}>Add Row</button>
          <button onClick={addColumn}>Add Column</button>
        </div>
        <table>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const cellStyle = getConditionalStyle(cell, rowIndex, colIndex);
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  return (
                    <td 
                      key={colIndex} 
                      style={{
                        ...cellStyle,
                        backgroundColor: isSelected ? '#e0e0e0' : cellStyle.backgroundColor
                      }}
                      onClick={() => {
                        setSelectedCell({ row: rowIndex, col: colIndex });
                      }}
                      onDoubleClick={() => {
                        setSelectedCell({ row: rowIndex, col: colIndex });
                        setEditMode(true);
                      }}
                      onCopy={(e) => handleCopy(e)}
                      onPaste={(e) => handlePaste(e)}
                    >
                      {editMode && isSelected ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                          onBlur={() => setEditMode(false)}
                          autoFocus
                        />
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
