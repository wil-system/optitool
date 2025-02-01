// 기존 타입 정의에 추가
export interface IEcountZone {
  ZONE: string;
  DOMAIN: string;
  EXPIRE_DATE: string;
  Status?: {
    Code: string;
    Message: string;
  };
  Data?: {
    ZONE: string;
    DOMAIN: string;
    EXPIRE_DATE: string;
  };
}

export interface IEcountLogin {
  CompanyNo: string;
  UserNo: string;
  Zone: string;
}

export interface IEcountLoginResponse {
  Data: {
    EXPIRE_DATE: string;
    NOTICE: string;
    Code: string;
    Datas: {
      COM_CODE: string;
      USER_ID: string;
      SESSION_ID: string;
      SET_COOKIE?: string;  // 필요한 경우 추가
    };
    Message: string;
    RedirectUrl: string;
  };
  Status: string;
  Error: null | string;
  Timestamp: string;
}

export interface IEcountInventory {
  warehouse_code: string;
  warehouse_name: string;
  product_code: string;
  product_name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  last_updated: string;
}

export interface IEcountInventoryItem {
  PROD_CD: string;      // 품목코드
  PROD_DES: string;     // 품목명
  PROD_SIZE_DES: string; // 규격
  BAL_QTY: string;      // 수량
  WH_CD: string;        // 창고코드
}

export interface IEcountInventoryResponse {
  Status: string;
  Data: {
    Code: string;
    Message: string;
    Result: IEcountInventoryItem[];
  };
} 