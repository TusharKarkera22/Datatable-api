import { useState, useEffect, useRef } from "react";
import {
  DataTable,
  DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import axios from "axios";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { ChevronDownIcon } from "@primer/octicons-react";

interface ApiData {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

function App() {
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<{
    [page: number]: number[];
  }>({});
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    limit: 12,
    offset: 0,
    total_pages: 0,
    current_page: 1,
  });
  const [inputNumber, setInputNumber] = useState<number | null>(null);

  const overlayPanelRef = useRef<OverlayPanel>(null);

  const fetchApiData = async (page: number) => {
    try {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${paginationInfo.limit}`
      );
      const data = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));
      setApiData(data);
      setPaginationInfo(response.data.pagination);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchApiData(1);
  }, []);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    fetchApiData(event.page + 1);
  };

  const onSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<ApiData[]>
  ) => {
    const selectedItems = e.value || [];
    const selectedIds = selectedItems.map((item) => item.id);

    setSelectedItemIds((prevSelectedItemIds) => ({
      ...prevSelectedItemIds,
      [paginationInfo.current_page]: selectedIds,
    }));
  };

  const onPopupSubmit = async () => {
    if (inputNumber === null) return;

    let remainingItems = inputNumber;
    let currentPage = paginationInfo.current_page;
    let newSelectedItemIds = { ...selectedItemIds };

    while (remainingItems > 0) {
      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${paginationInfo.limit}`
        );
        const pageData = response.data.data;
        const pageItems = pageData.map((item: ApiData) => item.id);

        const itemsToSelectOnThisPage = Math.min(
          remainingItems,
          pageItems.length
        );

        newSelectedItemIds[currentPage] = pageItems.slice(
          0,
          itemsToSelectOnThisPage
        );

        remainingItems -= itemsToSelectOnThisPage;
        currentPage++;

        console.log(
          `Selected ${itemsToSelectOnThisPage} items on page ${currentPage - 1}`
        );
      } catch (error) {
        console.error(`Error fetching data for page ${currentPage}:`, error);
        break;
      }
    }

    setSelectedItemIds(newSelectedItemIds);
    overlayPanelRef.current?.hide();
  };

  const selectedIdsForCurrentPage =
    selectedItemIds[paginationInfo.current_page] || [];

  const selectedApiData = apiData.filter((item) =>
    selectedIdsForCurrentPage.includes(item.id)
  );

  const totalSelectedItems = Object.values(selectedItemIds).reduce(
    (acc, ids) => acc + ids.length,
    0
  );

  const headerWithIcon = (
    <>
      <span
        style={{ marginLeft: "8px", cursor: "pointer" }}
        onClick={(e) => overlayPanelRef.current?.toggle(e)}
      >
        <ChevronDownIcon />
      </span>

      <OverlayPanel
        ref={overlayPanelRef}
        id="overlay_panel"
        style={{ width: "200px" }}
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="numberInput">Enter Number</label>
            <InputNumber
              inputId="numberInput"
              value={inputNumber}
              onValueChange={(e) => setInputNumber(e.value ?? 0)}
            />
          </div>
          <Button
            style={{ marginTop: "10px" }}
            label="Submit"
            icon="pi pi-check"
            onClick={onPopupSubmit}
          />
        </div>
      </OverlayPanel>
    </>
  );

  return (
    <>
      <div>{totalSelectedItems} items selected</div>
      <DataTable
        value={apiData}
        selection={selectedApiData}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
        ></Column>
        <Column header={headerWithIcon}></Column>
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place of Origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start Date"></Column>
        <Column field="date_end" header="End Date"></Column>
      </DataTable>
      <Paginator
        first={(paginationInfo.current_page - 1) * paginationInfo.limit}
        rows={paginationInfo.limit}
        totalRecords={paginationInfo.total}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default App;
