import { ContentType } from "../../types";
import { stringifyData } from "../../utils";
import { isNil } from "es-toolkit/predicate";
import { isObject, isString } from "es-toolkit/compat";

/**
 * ContentTypeHandler - 컨텐츠 타입별 요청/응답 처리를 담당하는 클래스
 */
export class ContentTypeHandler {
	/**
	 * Content Type 매칭 헬퍼 메서드들
	 */
	static isJsonContentType(contentType: string): boolean {
		return contentType === ContentType.JSON || contentType.includes("application/json");
	}

	static isFormContentType(contentType: string): boolean {
		return contentType === ContentType.FORM || contentType.includes("application/x-www-form-urlencoded");
	}

	static isXmlContentType(contentType: string): boolean {
		return contentType === ContentType.XML || contentType.includes("application/xml");
	}

	static isHtmlContentType(contentType: string): boolean {
		return contentType === ContentType.HTML || contentType.includes("text/html");
	}

	static isTextContentType(contentType: string): boolean {
		return contentType === ContentType.TEXT || contentType.includes("text/plain");
	}

	static isBlobContentType(contentType: string): boolean {
		return contentType === ContentType.BLOB || contentType.includes("application/octet-stream");
	}

	/**
	 * Form 데이터 처리
	 */
	static createFormBody(data: unknown): BodyInit {
		if (isObject(data) && !(data instanceof URLSearchParams)) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(data as Record<string, string>)) {
				if (!isNil(value)) {
					params.append(key, String(value));
				}
			}
			return params;
		}

		if (data instanceof URLSearchParams) {
			return data;
		}

		return String(data || "");
	}

	/**
	 * 텍스트 계열 데이터 처리
	 */
	static createTextBody(data: unknown): BodyInit {
		return isString(data) ? data : String(data);
	}

	/**
	 * 바이너리 데이터 처리
	 */
	static createBlobBody(data: unknown): BodyInit {
		if (data instanceof Blob || data instanceof ArrayBuffer) {
			return data;
		}
		return isString(data) ? data : String(data);
	}

	/**
	 * 데이터가 JSON으로 처리되어야 하는 일반 객체인지 확인
	 */
	static isPlainObjectForJson(data: unknown): boolean {
		return isObject(data) && !(data instanceof FormData) && !(data instanceof URLSearchParams) && !(data instanceof Blob);
	}

	/**
	 * Content-Type이 비어있고 데이터가 JSON으로 처리되어야 하는지 확인
	 */
	static shouldDefaultToJson(effectiveContentType: string, data: unknown): boolean {
		return effectiveContentType === "" && this.isPlainObjectForJson(data);
	}

	/**
	 * 특정 콘텐츠 타입에 맞게 요청 본문 데이터를 준비합니다.
	 */
	static prepareRequestBody(
		data: unknown,
		contentType: string,
		headers: Record<string, string>,
	): { body: BodyInit | null; headers: Record<string, string> } {
		const headersCopy = { ...headers };

		// FormData, URLSearchParams, Blob은 직접 전달
		if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob) {
			// FormData의 경우 Content-Type 헤더를 설정하지 않도록 함
			if (data instanceof FormData && (contentType === "" || contentType === ContentType.MULTIPART)) {
				const { "Content-Type": _, ...remainingHeaders } = headersCopy;
				return { body: data, headers: remainingHeaders };
			}
			return { body: data, headers: headersCopy };
		}

		// 문자열로 변환된 컨텐츠 타입
		const contentTypeStr = String(contentType);

		// 컨텐츠 타입에 따른 처리
		if (this.isJsonContentType(contentTypeStr)) {
			return {
				body: stringifyData(data),
				headers: { ...headersCopy, "Content-Type": ContentType.JSON },
			};
		}

		if (this.isFormContentType(contentTypeStr)) {
			return {
				body: this.createFormBody(data),
				headers: { ...headersCopy, "Content-Type": ContentType.FORM },
			};
		}

		if (this.isXmlContentType(contentTypeStr)) {
			return {
				body: this.createTextBody(data),
				headers: { ...headersCopy, "Content-Type": ContentType.XML },
			};
		}

		if (this.isHtmlContentType(contentTypeStr)) {
			return {
				body: this.createTextBody(data),
				headers: { ...headersCopy, "Content-Type": ContentType.HTML },
			};
		}

		if (this.isTextContentType(contentTypeStr)) {
			return {
				body: this.createTextBody(data),
				headers: { ...headersCopy, "Content-Type": ContentType.TEXT },
			};
		}

		if (this.isBlobContentType(contentTypeStr)) {
			return {
				body: this.createBlobBody(data),
				headers: { ...headersCopy, "Content-Type": ContentType.BLOB },
			};
		}

		// 기타 컨텐츠 타입
		const body = isObject(data) ? stringifyData(data) : String(data);
		return {
			body,
			headers: { ...headersCopy, "Content-Type": contentTypeStr },
		};
	}
}