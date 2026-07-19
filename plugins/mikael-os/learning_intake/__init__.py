"""Write-free university learning intake for Mikael OS."""

from .attachments import (
    PdfAttachment,
    analyze_pdf_attachments,
    gateway_pdf_attachments,
)

__all__ = [
    "PdfAttachment",
    "analyze_pdf_attachments",
    "gateway_pdf_attachments",
]
